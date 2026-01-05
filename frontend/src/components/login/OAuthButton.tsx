import { Button } from "../common/Button";
import { useAuth } from "../../auth/useAuth";

interface OAuthButtonProps {
  provider: string;
}

const providerConfig: Record<
  string,
  { name: string; icon: string; bgColor: string }
> = {
  google: {
    name: "Google",
    icon: "G",
    bgColor: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50",
  },
  github: {
    name: "GitHub",
    icon: "GH",
    bgColor: "bg-gray-900 text-white hover:bg-gray-800",
  },
  microsoft: {
    name: "Microsoft",
    icon: "M",
    bgColor: "bg-blue-600 text-white hover:bg-blue-700",
  },
};

export const OAuthButton = ({ provider }: OAuthButtonProps) => {
  const { startOAuth } = useAuth();
  const config = providerConfig[provider] || {
    name: provider,
    icon: provider.charAt(0).toUpperCase(),
    bgColor: "bg-gray-600 text-white hover:bg-gray-700",
  };

  const handleClick = async () => {
    await startOAuth(provider);
  };

  return (
    <Button
      onClick={handleClick}
      variant="outline"
      className={`w-full ${config.bgColor}`}
    >
      <span className="mr-2 font-bold">{config.icon}</span>
      {config.name}でログイン
    </Button>
  );
};
