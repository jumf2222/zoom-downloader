import { ChangeEventHandler, FunctionComponent, useEffect, useState } from "react";
import { useHistory } from "react-router";
import { STATUS_CODES, User } from "../../types";
import styles from "./index.module.css";

interface IProps {
    isMobile: boolean;
    setToken: (token: string) => void;
    token: string;
    setUser: (user: User) => void;
    user: User | null;
}

const Component: FunctionComponent<IProps> = ({ isMobile, token, setToken, setUser, user }) => {
    const history = useHistory();
    const [users, setUsers] = useState<User[]>([]);

    const [tokenErrors, setTokenErrors] = useState("");
    const [otherErrors, setOtherErrors] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const onTokenChange: ChangeEventHandler<HTMLInputElement> = (event) => {
        changeToken(event.target.value);
    };

    const changeToken = (value: string) => {
        // Validators
        if (value.trim().length === 0) {
            setTokenErrors("This field is required");
        } else {
            setTokenErrors("");
        }

        setToken(value);
    };

    const selectUser = (user: User) => {
        setUser(user);
        history.push("/");
    };

    useEffect(() => {
        let timeout = 0;

        setUsers([]);
        setIsLoading(false);

        if (token.trim() !== "") {
            setIsLoading(true);
            timeout = setTimeout(async () => {
                let result = await fetch(
                    `https://free-cors-bypass.herokuapp.com/https://api.zoom.us/v2/users?page_size=300`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "content-type": "application/json",
                        },
                    }
                );

                setIsLoading(false);

                switch (result.status) {
                    case STATUS_CODES.OK:
                        let data = await result.json();
                        setUsers(data.users);
                        console.log(data);
                        setTokenErrors("");
                        break;

                    case STATUS_CODES.UNAUTHORIZED:
                        setTokenErrors("Invalid jwt");
                        break;

                    case STATUS_CODES.INTERNAL_SERVER_ERROR:
                        setOtherErrors("Error: Please try again later.");
                        return setIsLoading(false);

                    default:
                        break;
                }
            }, 1000) as any;
        } else {
            setIsLoading(false);
        }

        return () => { clearTimeout(timeout); };
    }, [token]);


    return <form className="padding">
        <label>
            JWT
            <input className={tokenErrors !== "" ? "error" : ""} onChange={onTokenChange} value={token} />
            <p className="error">{tokenErrors}</p>
        </label>
        <p>Users</p>
        <div className="vbox gap">
            {isLoading ? <div className="spinner" /> : null}
            {
                users.map(userObj => <button key={userObj.id}
                    type="button"
                    className={userObj.id === user?.id ? styles.selected : ""}
                    onClick={() => { selectUser(userObj); }}>{`${userObj.first_name} ${userObj.last_name}`}
                </button>)
            }
        </div>
        <p className="error">{otherErrors}</p>
    </form>;
};

export default Component;
