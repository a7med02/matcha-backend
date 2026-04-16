import { generateEmailVerificationCode } from "./email-verification";

const runTest = () => {
    console.log("Running tests...");

    console.log("Random test number: ", generateEmailVerificationCode());
};

runTest();
