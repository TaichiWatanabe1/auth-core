import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { useAuth } from "../../auth/useAuth";

const loginSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
});

const registerSchema = loginSchema
  .extend({
    confirmPassword: z.string(),
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: "利用規約への同意が必要です",
    }),
    agreeToPrivacy: z.boolean().refine((val) => val === true, {
      message: "プライバシーポリシーへの同意が必要です",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "パスワードが一致しません",
    path: ["confirmPassword"],
  });

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

interface EmailPasswordFormProps {
  onSuccess?: () => void;
}

export const EmailPasswordForm = ({ onSuccess }: EmailPasswordFormProps) => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const { login, register: registerUser } = useAuth();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const handleLogin = async (data: LoginFormData) => {
    setError(null);
    setLoading(true);
    try {
      await login(data.email, data.password);
      onSuccess?.();
    } catch (err: unknown) {
      const errorData = err as { response?: { data?: { detail?: string } } };
      setError(errorData.response?.data?.detail || "ログインに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (data: RegisterFormData) => {
    setError(null);
    setLoading(true);
    try {
      await registerUser(data.email, data.password);
      setRegisterSuccess(true);
      setTimeout(() => {
        setMode("login");
        setRegisterSuccess(false);
        loginForm.setValue("email", data.email);
      }, 2000);
    } catch (err: unknown) {
      const errorData = err as { response?: { data?: { detail?: string } } };
      setError(errorData.response?.data?.detail || "登録に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setError(null);
    setRegisterSuccess(false);
  };

  if (registerSuccess) {
    return (
      <div className="text-center py-8">
        <div className="text-green-600 mb-2">
          <svg
            className="w-16 h-16 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <p className="text-gray-600">
          登録が完了しました。ログイン画面に移動します...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {mode === "login" ? (
        <form
          onSubmit={loginForm.handleSubmit(handleLogin)}
          className="space-y-4"
        >
          <Input
            label="メールアドレス"
            type="email"
            {...loginForm.register("email")}
            error={loginForm.formState.errors.email?.message}
            placeholder="example@email.com"
          />
          <Input
            label="パスワード"
            type="password"
            {...loginForm.register("password")}
            error={loginForm.formState.errors.password?.message}
            placeholder="••••••••"
          />
          <Button type="submit" className="w-full" loading={loading}>
            ログイン
          </Button>
        </form>
      ) : (
        <form
          onSubmit={registerForm.handleSubmit(handleRegister)}
          className="space-y-4"
        >
          <Input
            label="メールアドレス"
            type="email"
            {...registerForm.register("email")}
            error={registerForm.formState.errors.email?.message}
            placeholder="example@email.com"
          />
          <Input
            label="パスワード"
            type="password"
            {...registerForm.register("password")}
            error={registerForm.formState.errors.password?.message}
            placeholder="••••••••"
          />
          <Input
            label="パスワード（確認）"
            type="password"
            {...registerForm.register("confirmPassword")}
            error={registerForm.formState.errors.confirmPassword?.message}
            placeholder="••••••••"
          />

          {/* 同意チェックボックス */}
          <div className="space-y-3">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="agreeToTerms"
                {...registerForm.register("agreeToTerms")}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="agreeToTerms"
                className="ml-2 text-sm text-gray-600"
              >
                <Link
                  to="/terms"
                  target="_blank"
                  className="text-blue-600 hover:underline"
                >
                  利用規約
                </Link>
                に同意します
              </label>
            </div>
            {registerForm.formState.errors.agreeToTerms && (
              <p className="text-red-500 text-xs ml-6">
                {registerForm.formState.errors.agreeToTerms.message}
              </p>
            )}

            <div className="flex items-start">
              <input
                type="checkbox"
                id="agreeToPrivacy"
                {...registerForm.register("agreeToPrivacy")}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="agreeToPrivacy"
                className="ml-2 text-sm text-gray-600"
              >
                <Link
                  to="/privacy"
                  target="_blank"
                  className="text-blue-600 hover:underline"
                >
                  プライバシーポリシー
                </Link>
                に同意します
              </label>
            </div>
            {registerForm.formState.errors.agreeToPrivacy && (
              <p className="text-red-500 text-xs ml-6">
                {registerForm.formState.errors.agreeToPrivacy.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" loading={loading}>
            登録
          </Button>
        </form>
      )}

      <div className="text-center">
        <button
          type="button"
          onClick={switchMode}
          className="text-sm text-blue-600 hover:underline"
        >
          {mode === "login"
            ? "アカウントをお持ちでない方はこちら"
            : "アカウントをお持ちの方はこちら"}
        </button>
      </div>
    </div>
  );
};
