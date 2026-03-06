"use client";

import { useState, type FormEvent } from "react";

const FORMSPREE_URL = "https://formspree.io/f/YOUR_FORM_ID"; // Replace with real Formspree form ID

type Status = "idle" | "submitting" | "success" | "error";

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");

    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch(FORMSPREE_URL, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        setStatus("success");
        form.reset();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <section className="contact-form">
        <div className="contact-form__success">
          <p>お問い合わせありがとうございます。</p>
          <p lang="en">Thank you for your inquiry. We will get back to you soon.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="contact-form">
      <form onSubmit={handleSubmit} noValidate={false}>
        {/* Honeypot */}
        <input type="text" name="_gotcha" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />

        <div className="contact-form__field">
          <label htmlFor="contact-name">
            お名前 <span lang="en">Name</span>
          </label>
          <input id="contact-name" name="name" type="text" required />
        </div>

        <div className="contact-form__field">
          <label htmlFor="contact-email">
            メールアドレス <span lang="en">Email</span>
          </label>
          <input id="contact-email" name="email" type="email" required />
        </div>

        <div className="contact-form__field">
          <label htmlFor="contact-message">
            お問い合わせ内容 <span lang="en">Message</span>
          </label>
          <textarea id="contact-message" name="message" required />
        </div>

        {status === "error" && (
          <div className="contact-form__error">
            <p>送信に失敗しました。もう一度お試しください。</p>
            <p lang="en">Submission failed. Please try again.</p>
          </div>
        )}

        <button className="contact-form__submit" type="submit" disabled={status === "submitting"}>
          {status === "submitting" ? "送信中… Sending…" : "送信する Send"}
        </button>
      </form>
    </section>
  );
}
