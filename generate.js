import OpenAI from "openai";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const input = (prompt) => {
  console.log(prompt);
  return new Promise((resolve) => {
    const stdin = process.openStdin();
    stdin.addListener("data", (d) => {
      resolve(d.toString().trim());
      stdin.end();
    });
  });
};

const initialize = async () => {
  if (!fs.existsSync("code")) {
    fs.mkdirSync("code");
  }

  const files = fs.readdirSync("code");
  if (files.length > 0) {
    console.log("WARNING: There are files in the code directory.");

    if ((await input("Do you want to delete them? (yes/no)")) === "yes") {
      for (const file of files) {
        fs.rmSync(`code/${file}`, { recursive: true });
      }
    }
    console.log("");
  }
};

const parse_filename = (message_content) => {
  let filename = message_content.split("\n")[0].split(" ")[1].trim();
  if (filename[0] === "<") {
    filename = filename.slice(1);
  }
  if (filename[0] === "/") {
    filename = filename.slice(1);
  }
  if (filename[0] === '"') {
    filename = filename.slice(1);
  }
  if (filename[filename.length - 1] === '"') {
    filename = filename.slice(0, -1);
  }
  if (filename[filename.length - 1] === ">") {
    filename = filename.slice(0, -1);
  }
  return filename;
};

const write_file = (filename, file_contents) => {
  const dirname = filename.split("/").slice(0, -1).join("/");
  if (!fs.existsSync(`code/${dirname}`)) {
    fs.mkdirSync(`code/${dirname}`, { recursive: true });
  }

  try {
    console.log(`Writing to file ${filename}...`);
    fs.writeFileSync(`code/${filename}`, strip_markdown(file_contents));
    console.log(`Successfully wrote to file ${filename}`);
  } catch (error) {
    console.error(`Failed to write to file ${filename}: ${error}`);
  }
};

const strip_markdown = (file_contents) => {
  if (file_contents.indexOf("```") === 0) {
    file_contents = file_contents.split("\n").slice(1, -1).join("\n");
  }

  return file_contents;
};

export const GenerateCode = async (prompt) => {
  const apiKey = process.env.OPENAI_API_KEY;
  const openai = new OpenAI({ apiKey });
  await initialize();

  let state = null;

  //   const prompt = await input("What do you want to create?");

  const messages = [
    {
      role: "system",
      content: `You are an AI assistant that can read files and write to files, and create directories in order to create complete, profession codebases.

Here are the actions you can take:
- write_file <filename>
- read_file <filename>
- create_dir <dirname>
- task_finished (call this when the whole codebase has been created)

Only perform one action per message.

When using write_file, you can write multiple lines of code. Add the code starting form the next line in the same message.

Don't use Markdown formatting in files (unless they are Markdown files)

All file and directory paths are relative from the root.

Respond only with the name of the command needed to be run next. For example, if you want to write to a file, you would respond with "write_file".
`,
    },
    {
      role: "user",
      content: prompt,
    },
  ];

  while (true) {
    const chatCompletion = await openai.chat.completions.create({
      messages: messages,
      model: "gpt-4o",
    });

    const message = chatCompletion.choices[0].message;
    console.log(message);
    const message_content = message.content;
    console.log(message_content);

    if (message_content === null) {
      throw new Error("Message content is null");
    }

    messages.push(message);

    if (message_content.indexOf("write_file") === 0) {
      const filename = parse_filename(message_content);
      const file_contents = message_content.split("\n").slice(1).join("\n");

      if (file_contents.trim() === "") {
        state = {
          type: "write_file",
          filename: filename,
        };
      } else {
        write_file(filename, file_contents);
      }
    } else if (message_content.indexOf("create_dir") === 0) {
      const dirname = parse_filename(message_content);
      console.log(`Creating directory ${dirname}...`);
      fs.mkdirSync(`code/${dirname}`, { recursive: true });
    } else if (message_content.indexOf("read_file") === 0) {
      const filename = parse_filename(message_content);
      // TODO
    } else if (message_content.indexOf("task_finished") === 0) {
      console.log("TASK FINISHED");
      break;
    } else if (state && state.type == "write_file") {
      write_file(state.filename, message_content);
      state = null;
    }
  }

  console.log("Done");

  return "Codebase created successfully 🎉🎉🎉";
  process.exit(0);
};
