import Header from "./components/Header";
import { ProtectedChat } from "./components/ProtectedChat";

export default function Home() {
  return (
    <>
      <Header />
      <ProtectedChat />
    </>
  );
}
