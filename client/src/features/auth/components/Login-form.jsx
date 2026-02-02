import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function LoginForm({ className, ...props }) {
  return (
    <form className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your email below to login to your account
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" type="email" placeholder="m@example.com" required />
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <a
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </a>
          </div>
          <Input id="password" type="password" required />
        </Field>
        <Field>
          <Button type="submit">Login</Button>
        </Field>
        <FieldSeparator>Or continue with</FieldSeparator>
        <Field>
          <Button variant="outline" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
              <path
                d="M24 9.5c3.54 0 6.7 1.22 9.2 3.6l6.9-6.9C35.9 2.38 30.3 0 24 0 14.6 0 6.4 5.38 2.5 13.22l8.1 6.29C12.5 13.3 17.8 9.5 24 9.5zm23.5 14.5c0-1.55-.14-3.04-.4-4.5H24v9h13.5c-.58 3.04-2.32 5.62-4.94 7.34l7.6 5.9C44.6 37.7 47.5 31.4 47.5 24zM10.6 28.49a14.5 14.5 0 0 1 0-9.02l-8.1-6.29a24 24 0 0 0 0 21.6l8.1-6.29zM24 48c6.3 0 11.6-2.08 15.5-5.66l-7.6-5.9c-2.1 1.4-4.8 2.2-7.9 2.2-6.2 0-11.5-3.8-13.4-9.3l-8.1 6.29C6.4 42.62 14.6 48 24 48z"
                fill="currentColor"
              />
            </svg>
            Sign in with Google
          </Button>
          <FieldDescription className="text-center">
            Don&apos;t have an account?{" "}
            <a href="/register" className="underline underline-offset-4">
              Sign up
            </a>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
