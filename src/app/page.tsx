import { ChatInterface } from "./components/ChatInterface";
import Header from "./components/Header";
import GoogleSignInButton from "./components/GoogleSignInButton";

export default function Home() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
              Welcome to Brain Plan
            </h1>
            <p className="mt-4 text-xl text-gray-500 dark:text-gray-400">
              Get started by signing in with your Google account
            </p>
            <div className="mt-6 inline-block">
              <GoogleSignInButton />
            </div>
          </div>
        </div>
        <ChatInterface />
      </main>
    </>
  );
}
