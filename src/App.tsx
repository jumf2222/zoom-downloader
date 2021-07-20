import { FunctionComponent, useEffect, useState } from "react";
import { HashRouter, Redirect, Route, Switch } from "react-router-dom";
import Home from "./components/home";
import UserSelect from "./components/userSelect";
import { User } from "./types";

const App: FunctionComponent = () => {
  const [token, setToken] = useState<string>("");
  const [user, setUser] = useState<User | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    let token = sessionStorage.getItem("token");

    if (token) {
      // let user = jwt.decode(token, { json: true });
      // if (token && token.exp && Math.floor(Date.now() / 1000) <= token.exp) {
      //   setUser(user);
      // } else {
      //   setToken("");
      // }
      setToken(token);
    }

    const resizeHandler = () => {
      setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    };

    window.addEventListener("resize", resizeHandler);
    resizeHandler();

    return () => { window.removeEventListener("resize", resizeHandler); };
  }, []);

  useEffect(() => {
    sessionStorage.setItem("token", token);

    if (!token) {
      setUser(null);
    }
  }, [token]);

  return <HashRouter>
    <Switch>
      <Route path="/user" >
        <UserSelect isMobile={isMobile} token={token} setToken={setToken} setUser={setUser} user={user} />
      </Route>
      <Route path="/" >
        {!token || !user ? <Redirect to="/user" /> : <Home isMobile={isMobile} token={token} setToken={setToken} setUser={setUser} user={user} />}
      </Route>
    </Switch>
  </HashRouter>;
};

export default App;
