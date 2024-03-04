import path = require('path');
import generate = require('@babel/generator');
import parser = require('@babel/parser');
import traverse = require('@babel/traverse');
import t = require('@babel/types');
import webpack = require('webpack');

namespace webpackRscServerLoader {
  export interface WebpackRscServerLoaderOptions {
    readonly clientReferencesMap: ClientReferencesMap;
  }

  export type ClientReferencesMap = Map<string, ClientReference[]>;

  export interface ClientReference {
    readonly id: string;
    readonly exportName: string;
    ssrId?: string | number;
  }
}

type RegisterReferenceType = 'Server' | 'Client';

interface FunctionInfo {
  readonly name: string;
  readonly hasUseServerDirective: boolean;
}

interface ExportedFunctionInfo {
  readonly localName: string;
  readonly exportName: string;
  readonly hasUseServerDirective: boolean;
}

const webpackRscServerLoader: webpack.LoaderDefinitionFunction<webpackRscServerLoader.WebpackRscServerLoaderOptions> =
  function (source, sourceMap) {
    this.cacheable(true);

    const {clientReferencesMap} = this.getOptions();
    const clientReferences: webpackRscServerLoader.ClientReference[] = [];
    const resourcePath = this.resourcePath;

    const ast = parser.parse(source, {
      sourceType: `module`,
      sourceFilename: resourcePath,
    });

    let moduleDirective: 'use client' | 'use server' | undefined;
    let addedRegisterReferenceCall: RegisterReferenceType | undefined;
    const unshiftedNodes = new Set<t.Node>();
    const functions: FunctionInfo[] = [];

    traverse.default(ast, {
      enter(nodePath) {
        const {node} = nodePath;

        if (t.isExportNamedDeclaration(node)) {
          return nodePath.skip();
        }

        const functionInfo = getFunctionInfo(node);

        if (functionInfo) {
          functions.push(functionInfo);
        }
      },
    });

    traverse.default(ast, {
      enter(nodePath) {
        const {node} = nodePath;

        if (t.isProgram(node)) {
          if (node.directives.some(isDirective(`use client`))) {
            moduleDirective = `use client`;
          } else if (node.directives.some(isDirective(`use server`))) {
            moduleDirective = `use server`;
          }

          return;
        }

        if (
          (t.isDirective(node) && isDirective(`use client`)(node)) ||
          unshiftedNodes.has(node)
        ) {
          return nodePath.skip();
        }

        const exportedFunctions = getExportedFunctions(node, functions);

        if (moduleDirective === `use client`) {
          if (exportedFunctions.length === 0) {
            return nodePath.remove();
          }

          const exportedClientReferences: t.ExportNamedDeclaration[] = [];

          for (const {exportName} of exportedFunctions) {
            const id = `${path.relative(process.cwd(), resourcePath)}`;
            clientReferences.push({id, exportName});
            addedRegisterReferenceCall = `Client`;

            exportedClientReferences.push(
              createExportedClientReference(id, exportName),
            );
          }

          // I have no idea why the array of nodes needs to be duplicated for
          // replaceWithMultiple to work properly. ¯\_(ツ)_/¯
          nodePath.replaceWithMultiple([
            ...exportedClientReferences,
            ...exportedClientReferences,
          ]);

          nodePath.skip();
        } else {
          for (const functionInfo of exportedFunctions) {
            if (
              moduleDirective === `use server` ||
              functionInfo.hasUseServerDirective
            ) {
              addedRegisterReferenceCall = `Server`;
              nodePath.insertAfter(createRegisterServerReference(functionInfo));
            }
          }
        }
      },
      exit(nodePath) {
        if (!t.isProgram(nodePath.node) || !addedRegisterReferenceCall) {
          nodePath.skip();

          return;
        }

        const nodes: t.Node[] = [
          createRegisterReferenceImport(addedRegisterReferenceCall),
        ];

        if (addedRegisterReferenceCall === `Client`) {
          nodes.push(createClientReferenceProxyImplementation());
        }

        for (const node of nodes) {
          unshiftedNodes.add(node);
        }

        (nodePath as traverse.NodePath<t.Program>).unshiftContainer(
          `body`,
          nodes,
        );
      },
    });

    if (!addedRegisterReferenceCall) {
      return this.callback(null, source, sourceMap);
    }

    if (clientReferences.length > 0) {
      clientReferencesMap.set(resourcePath, clientReferences);
    }

    const {code, map} = generate.default(
      ast,
      {
        sourceFileName: this.resourcePath,
        sourceMaps: this.sourceMap,
        // @ts-expect-error
        inputSourceMap: sourceMap,
      },
      source,
    );

    this.callback(null, code, map ?? sourceMap);
  };

function isDirective(
  value: 'use client' | 'use server',
): (directive: t.Directive) => boolean {
  return (directive) =>
    t.isDirectiveLiteral(directive.value) && directive.value.value === value;
}

function getExportedFunctions(
  node: t.Node,
  functions: FunctionInfo[],
): ExportedFunctionInfo[] {
  const exportedFunctions: ExportedFunctionInfo[] = [];

  if (t.isExportNamedDeclaration(node)) {
    if (node.declaration) {
      const functionInfo = getFunctionInfo(node.declaration);

      if (functionInfo) {
        exportedFunctions.push({
          localName: functionInfo.name,
          exportName: functionInfo.name,
          hasUseServerDirective: functionInfo.hasUseServerDirective,
        });
      }
    } else {
      for (const specifier of node.specifiers) {
        if (
          t.isExportSpecifier(specifier) &&
          t.isIdentifier(specifier.exported)
        ) {
          const functionInfo = functions.find(
            ({name}) => name === specifier.local.name,
          );

          if (functionInfo) {
            exportedFunctions.push({
              localName: specifier.local.name,
              exportName: specifier.exported.name,
              hasUseServerDirective: functionInfo.hasUseServerDirective,
            });
          }
        }
      }
    }
  }

  return exportedFunctions;
}

function getFunctionInfo(node: t.Node): FunctionInfo | undefined {
  let name: string | undefined;
  let hasUseServerDirective = false;

  if (t.isFunctionDeclaration(node)) {
    name = node.id?.name;

    hasUseServerDirective = node.body.directives.some(
      isDirective(`use server`),
    );
  } else if (t.isVariableDeclaration(node)) {
    const [variableDeclarator] = node.declarations;

    if (variableDeclarator) {
      const {id, init} = variableDeclarator;

      if (
        t.isIdentifier(id) &&
        (t.isArrowFunctionExpression(init) || t.isFunctionExpression(init))
      ) {
        name = id.name;

        if (t.isBlockStatement(init.body)) {
          hasUseServerDirective = init.body.directives.some(
            isDirective(`use server`),
          );
        }
      }
    }
  }

  return name ? {name, hasUseServerDirective} : undefined;
}

function createExportedClientReference(
  id: string,
  exportName: string,
): t.ExportNamedDeclaration {
  return t.exportNamedDeclaration(
    t.variableDeclaration(`const`, [
      t.variableDeclarator(
        t.identifier(exportName),
        t.callExpression(t.identifier(`registerClientReference`), [
          t.callExpression(t.identifier(`createClientReferenceProxy`), [
            t.stringLiteral(exportName),
          ]),
          t.stringLiteral(id),
          t.stringLiteral(exportName),
        ]),
      ),
    ]),
  );
}

function createClientReferenceProxyImplementation(): t.FunctionDeclaration {
  return t.functionDeclaration(
    t.identifier(`createClientReferenceProxy`),
    [t.identifier(`exportName`)],
    t.blockStatement([
      t.returnStatement(
        t.arrowFunctionExpression(
          [],
          t.blockStatement([
            t.throwStatement(
              t.newExpression(t.identifier(`Error`), [
                t.templateLiteral(
                  [
                    t.templateElement({raw: `Attempted to call `}),
                    t.templateElement({raw: `() from the server but `}),
                    t.templateElement(
                      {
                        raw: ` is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.`,
                      },
                      true,
                    ),
                  ],
                  [t.identifier(`exportName`), t.identifier(`exportName`)],
                ),
              ]),
            ),
          ]),
        ),
      ),
    ]),
  );
}

function createRegisterServerReference(
  functionInfo: ExportedFunctionInfo,
): t.CallExpression {
  return t.callExpression(t.identifier(`registerServerReference`), [
    t.identifier(functionInfo.localName),
    t.identifier(webpack.RuntimeGlobals.moduleId),
    t.stringLiteral(functionInfo.exportName),
  ]);
}

function createRegisterReferenceImport(
  type: RegisterReferenceType,
): t.ImportDeclaration {
  return t.importDeclaration(
    [
      t.importSpecifier(
        t.identifier(`register${type}Reference`),
        t.identifier(`register${type}Reference`),
      ),
    ],
    t.stringLiteral(`react-server-dom-webpack/server`),
  );
}

export = webpackRscServerLoader;
