import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { useAuth } from "../../auth/useAuth";

const emailSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
});

const codeSchema = z.object({
  code: z.string().length(6, "6桁のコードを入力してください"),
});

type EmailFormData = z.infer<typeof emailSchema>;
type CodeFormData = z.infer<typeof codeSchema>;

interface CodeAuthFormProps {
  onSuccess?: () => void;
}

export const CodeAuthForm = ({ onSuccess }: CodeAuthFormProps) => {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { requestCode, loginWithCode } = useAuth();

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const codeForm = useForm<CodeFormData>({
    resolver: zodResolver(codeSchema),
  });

  const handleRequestCode = async (data: EmailFormData) => {
    setError(null);
    setLoading(true);
    try {
      const response = await requestCode(data.email);
      setEmail(data.email);
      setMessage(response.message);
      setStep("code");
    } catch (err: unknown) {
      const errorData = err as { response?: { data?: { detail?: string } } };
      setError(
        errorData.response?.data?.detail || "コードの送信に失敗しました"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (data: CodeFormData) => {
    setError(null);
    setLoading(true);
    try {
      await loginWithCode(email, data.code);
      onSuccess?.();
    } catch (err: unknown) {
      const errorData = err as { response?: { data?: { detail?: string } } };
      setError(
        errorData.response?.data?.detail || "コードの検証に失敗しました"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep("email");
    setError(null);
    setMessage(null);
    codeForm.reset();
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {message && step === "code" && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 text-sm">
          {message}
        </div>
      )}

      {step === "email" ? (
        <form
          onSubmit={emailForm.handleSubmit(handleRequestCode)}
          className="space-y-4"
        >
          <Input
            label="メールアドレス"
            type="email"
            {...emailForm.register("email")}
            error={emailForm.formState.errors.email?.message}
            placeholder="example@email.com"
          />
          <Button type="submit" className="w-full" loading={loading}>
            認証コードを送信
          </Button>
        </form>
      ) : (
        <form
          onSubmit={codeForm.handleSubmit(handleVerifyCode)}
          className="space-y-4"
        >
          <div className="text-sm text-gray-600 mb-4">
            <span className="font-medium">{email}</span>{" "}
            に送信された6桁のコードを入力してください
          </div>
          <Input
            label="認証コード"
            type="text"
            maxLength={6}
            {...codeForm.register("code")}
            error={codeForm.formState.errors.code?.message}
            placeholder="000000"
            className="text-center text-2xl tracking-widest"
          />
          <Button type="submit" className="w-full" loading={loading}>
            ログイン
          </Button>
          <button
            type="button"
            onClick={handleBack}
            className="w-full text-sm text-gray-600 hover:underline"
          >
            メールアドレスを変更
          </button>
        </form>
      )}
    </div>
  );
};
