import { addMonths, format, isBefore, toDate } from "date-fns";
import { FunctionComponent, MouseEventHandler, useEffect, useState } from "react";
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

    // const [status, setStatus] = useState<string>("Download Meetings");
    const [meetings, setMeetings] = useState<any[]>([]);

    const [totalRecordings, setTotalRecordings] = useState<number>(0);
    const [downloaded, setDownloaded] = useState<number>(0);
    const [remainingTime, setRemainingTime] = useState<number>(0);

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

    const loadMeetings = async () => {
        if (!startDate || !endDate) return;

        setIsLoading(true);

        let meetings: any[] = [];
        let pageToken = "";

        let date = toDate(startDate);

        do {
            let result = await fetch(
                `https://free-cors-bypass.herokuapp.com/https://api.zoom.us/v2/users/${user.id
                }/recordings?from=${format(date, "yyyy-MM-dd")
                }&to=${format(addMonths(date, 1), "yyyy-MM-dd")
                }&next_page_token=${pageToken}&page_size=300`,
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

            if (!pageToken)
                date = addMonths(date, 1);

            pageToken = data.next_page_token;
            meetings = [...meetings, ...data.meetings];
            setMeetings(meetings);

        } while (pageToken || isBefore(date, endDate));

        setIsLoading(false);
    };

    useEffect(() => {
        let total = 0;

        for (const meeting of meetings) {
            total += meeting.recording_files.length;
        }

        console.log("HERE", meetings);
        setTotalRecordings(total);
    }, [meetings]);

    const download = async () => {
        if (!startDate || !endDate || meetings.length === 0) return;

        setIsLoading(true);

        let downloaded = 0;
        setDownloaded(0);
        setRemainingTime(0);

        try {
            const rootDir = await window.showDirectoryPicker();

            let startTime = performance.now();

            for (const meeting of meetings) {
                const meetingDir = await rootDir.getDirectoryHandle(`${meeting.topic} (${meeting.id})`.replaceAll(/[\\/:*?"<>|]/g, "-"), { create: true });

                for (const recording of meeting.recording_files) {
                    try {
                        if (await meetingDir.getFileHandle(`${recording.id}.${recording.file_extension}`)) {
                            setDownloaded(++downloaded);
                            setRemainingTime(((performance.now() - startTime) * totalRecordings / downloaded / 1000));
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

                    setDownloaded(++downloaded);
                    setRemainingTime(((performance.now() - startTime) * totalRecordings / downloaded / 1000));
                }
            }
        } catch (error) {
            console.error(error);
        }

        setRemainingTime(0);
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
            <div className="vbox gap">
                <div className="hbox gap">
                    <button className="spacer hbox" disabled={isLoading} type="button" onClick={loadMeetings}>
                        <div className="spacer" />
                        {isLoading ? <div className="spinner" /> : "Load Meetings"}
                        {isLoading ? <p>{` ${meetings.length}`}</p> : null}
                        {!isLoading ? <p>{` (${meetings.length})`}</p> : null}
                        <div className="spacer" />
                    </button>
                    <button className="spacer hbox" disabled={isLoading || meetings.length === 0}>
                        <div className="spacer" />
                        {isLoading ? <div><div className="spinner" /></div> : "Download Recordings"}
                        {!isLoading ? <p>{totalRecordings > 0 ? ` (${downloaded}/${totalRecordings})` : ""}</p> : null}
                        {isLoading ? <p>{totalRecordings > 0 ? ` ${downloaded}/${totalRecordings} ` : ""}</p> : null}
                        <p>{remainingTime > 0 ? ` (${remainingTime.toFixed(2)}s remaining)` : ""}</p>
                        <div className="spacer" />
                    </button>
                </div>
            </div>
        </form>
    </div>;
};

export default Component;
