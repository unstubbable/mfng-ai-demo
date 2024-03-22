import path from 'path';
import filenamify from 'filenamify';
import talkback from 'talkback';
import {z} from 'zod';

export interface OpenAiRecorderOptions {
  readonly port: number;
}

const chatCompletionsRequestBody = z.object({
  messages: z.array(
    z.object({
      role: z.union([
        z.literal(`system`),
        z.literal(`user`),
        z.literal(`function`),
        z.literal(`assistant`),
      ]),
      content: z.string(),
    }),
  ),
});

export async function startOpenAiRecorder({
  port,
}: OpenAiRecorderOptions): Promise<void> {
  const talkbackServer = talkback({
    host: `https://api.openai.com`,
    record: talkback.Options.RecordMode.NEW,
    port,
    path: path.join(import.meta.dirname, `tapes/openai`),
    summary: false,
    ignoreHeaders: [`user-agent`],
    tapeNameGenerator: (tapeNumber, tape) => {
      const result = chatCompletionsRequestBody.safeParse(
        JSON.parse(tape.req.body.toString(`utf-8`)),
      );

      if (result.success) {
        const {messages} = result.data;
        const userPrompt = messages.find(({role}) => role === `user`)?.content;

        if (userPrompt) {
          return `${filenamify(userPrompt)}-${tapeNumber}`;
        }
      }

      return `unnamed-${tapeNumber}`;
    },
  });

  await talkbackServer.start(() =>
    console.log(`OpenAI talkback server started`),
  );
}
