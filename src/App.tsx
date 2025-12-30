import { HeadlessApp } from "./core/HeadlessApp";
import { Shell } from "./ui/layout/Shell";
import { AppFrame } from "./ui/layout/AppFrame";
import { Home } from "./screens/Home";

function App() {
  return (
    <Shell>
      <HeadlessApp />
      <AppFrame>
        <Home />
      </AppFrame>
    </Shell>
  );
}

export default App;
