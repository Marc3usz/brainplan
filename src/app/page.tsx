import Header from "./components/Header";
import { ProtectedChat } from "./components/ProtectedChat";

export default function Home() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <div className="flex-1 overflow-hidden">
        <ProtectedChat />
      </div>
    </div>
  );
}
