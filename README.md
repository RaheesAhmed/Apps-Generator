## App Generator

This is a coding App Generator I'm working on. It creates full codebases from a single prompt to an LLM using `GPT-4o` Model.

## Quick Start

Clone the repo

```
git clone https://github.com/RaheesAhmed/Apps-Generator.git
```

Install packages:

```
npm install or npm i
```

create new file `.env` and add your api key

```
OPENAI_API_KEY=sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXXX

```

Run the code:

```
node index.js
```

## TEST Directly

run the `generate.js` to test the App Generator without api call

```
const prompt = `Create a complete codebase for a web application that allows users to sign up, log in, and view their profile. The application should have a backend API and a frontend. The backend should be written in Node.js and the frontend should be written in React. Use a database of your choice.`;

await GenerateCode(prompt);
```

A new `Code` Folder will be generated where your can find the app code
