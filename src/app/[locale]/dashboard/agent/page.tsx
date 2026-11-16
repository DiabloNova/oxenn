import { BrandIntelligenceChat } from "@/components/features/rag/BrandIntelligenceChat";

interface AgentPageProps {
  searchParams: Promise<{ new?: string }>;
}

export default async function AgentPage({ searchParams }: AgentPageProps) {
  const { new: conversationKey } = await searchParams;
  return <div className="min-h-[calc(100vh-9rem)]"><BrandIntelligenceChat key={conversationKey ?? "current"} /></div>;
}
