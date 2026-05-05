import { sesClient } from "../../../lib/aws/client";

export const sendVerificationEmail = async (email: string, link: string): Promise<void> => {
    const subject = "Verify your email";
    const text = `Verify your email by clicking this link: ${link}`;
    const html = `<p>Verify your email by clicking this link:</p><p><a href="${link}">${link}</a></p>`;

    await sesClient.sendEmail({ to: email, subject, html, text });
};

export const sendPasswordResetEmail = async (email: string, link: string): Promise<void> => {
    const subject = "Reset your password";
    const text = `Reset your password by clicking this link: ${link}`;
    const html = `<p>Reset your password by clicking this link:</p><p><a href="${link}">${link}</a></p>`;

    await sesClient.sendEmail({ to: email, subject, html, text });
};
