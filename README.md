# BrainPlan

BrainPlan to nowoczesna aplikacja webowa oparta na Next.js, umożliwiająca interakcję z dużymi modelami językowymi (LLM) poprzez integrację z serwerem Ollama. Projekt pełni funkcję asystenta AI z dodatkowymi narzędziami, zarządzaniem użytkownikami oraz rozbudowanym panelem ustawień.

---

## ✨ Funkcjonalności

- **Asystent AI (Chat Assistant):**
  - Bezpośrednia interakcja z modelem LLM (np. deepseek-r1:14b) poprzez przyjazny interfejs czatu
  - Szybkie akcje (Quick Actions) na dashboardzie
- **Panel użytkownika:**
  - Przegląd i edycja profilu
  - Zmiana hasła, e-maila, imienia
  - Usuwanie konta z potwierdzeniem
- **Bezpieczna autoryzacja:**
  - Rejestracja i logowanie użytkowników przez Firebase Authentication
  - Przechowywanie danych w MongoDB
- **Responsywny i nowoczesny interfejs:**
  - React 19, TailwindCSS, ikony, efekty hover, gridy
- **Łatwa rozbudowa:**
  - Struktura umożliwiająca dodawanie kolejnych narzędzi do asystenta

---

## 🛠️ Technologie

- **Next.js** (z Turbopackiem)
- **TypeScript**
- **React 19**
- **TailwindCSS**
- **Ollama** (lokalny serwer modeli LLM)
- **Firebase Authentication**
- **MongoDB**

---

## ⚡ Wymagania wstępne

- Node.js (zalecana wersja 18+)
- npm
- Zainstalowany i skonfigurowany serwer [Ollama](https://ollama.com/) (np. `ollama serve`)
- Model LLM dostępny na serwerze Ollama (np. `deepseek-r1:14b`)
- Dostęp do bazy MongoDB oraz kluczy Firebase (patrz `.env`)

---

## 🚀 Instrukcja uruchomienia

1. **Sklonuj repozytorium:**
   ```bash
   git clone <adres_repozytorium>
   cd brainplan
   ```

2. **Zainstaluj zależności:**
   ```bash
   npm install
   ```

3. **Skonfiguruj plik `.env`:**
   - Uzupełnij wymagane zmienne środowiskowe do MongoDB i Firebase (patrz przykładowy plik `.env.example` jeśli jest dostępny)


4. **Uruchom aplikację Next.js:**
   ```bash
   npm run dev
   ```

5. **Otwórz aplikację w przeglądarce:**
   - Domyślnie pod adresem: [http://localhost:3000](http://localhost:3000)

---

## 📁 Struktura projektu (wybrane elementy)

- `/src/app/components/` — komponenty React (czat, nagłówek, dashboard, itp.)
- `/src/services/ollama.ts` — integracja z serwerem Ollama
- `/pages/api/user/` — endpointy API do zarządzania użytkownikami

---

## ℹ️ Informacje dodatkowe

- **Licencja:** MIT
- **Autor:** Marc3usz
- **Kontakt:** [Twój e-mail lub link do profilu]

---

### Notatki
- Przed uruchomieniem upewnij się, że serwer Ollama działa i wybrany model jest dostępny.
- Jeśli pojawi się błąd 505 (internal error), sprawdź czy model jest poprawnie ustawiony w pliku `src/services/ollama.ts` oraz czy serwer Ollama jest aktywny.
- Projekt jest łatwy do rozbudowy o własne narzędzia i funkcje asystenta AI.


1.  Copy `.env.example` to `.env`
2.  Install dependencies:

    ```bash
    npm install
    ```
3.  Run the development server:

    ```bash
    npm run dev
    ```
4.  Open [http://localhost:3000](http://localhost:3000) in your browser.

# Creating New Tools

To create a new tool, follow these steps:

1. Create a new file in the `src/ollama/tools` directory (e.g., `myNewTool.ts`)
2. Define your tool using the following template:

```typescript
import { ToolFunction } from "../toolsLoader";

const functions: ToolFunction[] = [
  {
    type: "function",
    function: {
      name: "myNewTool",
      description: "Description of what your tool does",
    },
    execute: async (args: string): Promise<unknown> => {
      // Your tool implementation here
      return { result: "your result" };
    },
  },
];

export default functions;
```

3. Import and add your tool to `src/ollama/tools/index.ts`:

```typescript
import myNewTool from "./myNewTool";

const ollamaTools = [...findCity, ...getWeather, ...getSecret, ...getIpInfo, ...myNewTool];
```

The tool will be automatically available to the AI assistant. Make sure to:
- Provide a clear description of what your tool does
- Handle errors appropriately in the execute function
- Return a properly typed response
- Keep the implementation simple and focused
