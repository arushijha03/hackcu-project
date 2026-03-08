"use client";

import { useEffect } from "react";

export default function SignoutForm({ csrfToken }: { csrfToken: string }) {
  useEffect(() => {
    const form = document.getElementById("signout-form") as HTMLFormElement;
    if (form) form.submit();
  }, []);

  return (
    <form
      id="signout-form"
      action="/api/auth/signout"
      method="POST"
      className="hidden"
    >
      <input type="hidden" name="csrfToken" value={csrfToken} />
      <input type="hidden" name="callbackUrl" value="/" />
      <button type="submit">Sign out</button>
    </form>
  );
}
