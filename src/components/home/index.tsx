import { FunctionComponent, MouseEventHandler, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useHistory } from "react-router";
import { STATUS_CODES, User } from "../../types";

interface IProps {
    isMobile: boolean;
    setToken: (token: string) => void;
    token: string;
    setUser: (user: User | null) => void;
    user: User;
}

const Component: FunctionComponent<IProps> = ({ isMobile, token, setToken, setUser, user }) => {
    const history = useHistory();
    const [isLoading, setIsLoading] = useState(false);

    const [status, setStatus] = useState<string>("");

    const [startDate, setStartDate] = useState<Date | null>(new Date("2016/1/1"));
    const [endDate, setEndDate] = useState<Date | null>(new Date());

    const [startDateErrors, setStartDateErrors] = useState("");
    const [endDateErrors, setEndDateErrors] = useState("");

    const onStartDateChange = (value: Date | null) => {
        changeStartDate(value);
    };

    const changeStartDate = (value: Date | null) => {
        // Validators
        if (value == null) {
            setStartDateErrors("This field is required");
        } else {
            setStartDateErrors("");
        }

        setStartDate(value);
    };

    const onEndDateChange = (value: Date | null) => {
        changeEndDate(value);
    };


    const changeEndDate = (value: Date | null) => {
        // Validators
        if (value == null) {
            setEndDateErrors("This field is required");
        } else {
            setEndDateErrors("");
        }

        setEndDate(value);
    };

    // Fix for closing the datepicker on click
    const datePickerLabelClick: MouseEventHandler<HTMLLabelElement> = (e) => e.preventDefault();

    const download = async () => {
        if (!startDate || !endDate) return;

        setIsLoading(true);
        let result = await fetch(
            `https://free-cors-bypass.herokuapp.com/https://api.zoom.us/v2/users/${user.id
            }/recordings?from=${startDate.toISOString().split("T")[0]
            }&to=${endDate.toISOString().split("T")[0]
            }&page_size=300`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "content-type": "application/json",
                },
            }
        );

        switch (result.status) {
            case STATUS_CODES.OK:
                break;

            case STATUS_CODES.UNAUTHORIZED:
                return history.push("/user");

            default:
                break;
        }

        let data = await result.json();
        console.log(data);

        try {
            const rootDir = await window.showDirectoryPicker();


            let total = 0;
            let downloaded = 0;

            for (const meeting of data.meetings) {
                total += meeting.recording_files.length;
            }

            let startTime = performance.now();

            setStatus(`Downloaded ${downloaded}/${total}`);

            for (const meeting of data.meetings) {
                // console.log(meeting);
                // console.log("test");

                const meetingDir = await rootDir.getDirectoryHandle(`${meeting.topic} (${meeting.id})`.replaceAll(/[\\/:*?"<>|]/g, "-"), { create: true });

                for (const recording of meeting.recording_files) {
                    try {
                        if (await meetingDir.getFileHandle(`${recording.id}.${recording.file_extension}`)) {
                            setStatus(`Downloaded ${++downloaded}/${total} ${downloaded < total ? `(${((performance.now() - startTime) * total / downloaded / 1000).toFixed(2)}s remaining)` : ""}`);
                            continue;
                        }
                    } catch (error) { }

                    const recordingFileHandle = await meetingDir.getFileHandle(`${new Date(recording.recording_start).toLocaleString()
                        } to ${new Date(recording.recording_end).toLocaleString()
                        } (${recording.id}).${recording.file_extension}`.replaceAll(/[\\/:*?"<>|]/g, "-"),
                        { create: true });

                    const response = await fetch(
                        `https://free-cors-bypass.herokuapp.com/${recording.download_url}?access_token=${token}`
                    );

                    if (response.body) {
                        await response.body.pipeTo(await recordingFileHandle.createWritable());
                    }

                    setStatus(`Downloaded ${++downloaded}/${total} ${downloaded < total ? `(${((performance.now() - startTime) * total / downloaded / 1000).toFixed(2)}s remaining)` : ""}`);
                }
            }
        } catch (error) {
            setIsLoading(false);
        }
        setIsLoading(false);
    };

    return <div className="vbox gap padding">
        <h1>{`${user.first_name} ${user.last_name}`}</h1>
        <form onSubmit={event => { event.preventDefault(); download(); }}>
            <label onClick={datePickerLabelClick}>
                Start Date
                <DatePicker
                    selected={startDate}
                    showYearDropdown
                    showMonthDropdown
                    closeOnScroll={e => e.target === document}
                    onChange={onStartDateChange}
                    className={startDateErrors !== "" ? "error" : ""}
                />
                <p className="error">{startDateErrors}</p>
            </label>
            <label onClick={datePickerLabelClick}>
                End Date
                <DatePicker
                    selected={endDate}
                    showYearDropdown
                    showMonthDropdown
                    closeOnScroll={e => e.target === document}
                    onChange={onEndDateChange}
                    className={endDateErrors !== "" ? "error" : ""}
                />
                <p className="error">{endDateErrors}</p>
            </label>
            <button disabled={isLoading}>{isLoading ? <div className="spinner" /> : "Download"}</button>
            <p>{status}</p>
        </form>
    </div>;
};

export default Component;
