const download = async () => {
  let jwtInput = document.getElementById("JWT");
  let userIDInput = document.getElementById("userID");
  let pageToken = "";

  do {
    let result = await fetch(
      `https://free-cors-bypass.herokuapp.com/https://api.zoom.us/v2/users/${
        userIDInput.value
      }/recordings?from=${
        new Date("2016/1/1").toISOString().split("T")[0]
      }&to=${
        new Date().toISOString().split("T")[0]
      }&next_page_token=${pageToken}&page_size=300`,
      {
        headers: {
          Authorization: `Bearer ${jwtInput.value}`,
          "content-type": "application/json",
        },
      }
    );

    if (result.status !== 200) {
      console.log("Invalid userID");
      return;
    }

    let data = await result.json();
    console.log(data);
    pageToken = data.next_page_token;

    const rootDir = await window.showDirectoryPicker();

    for (const meeting of data.meetings) {
      console.log(meeting);
      console.log("test");
      const meetingDir = await rootDir.getDirectoryHandle(meeting.id, {
        create: true,
      });

      for (const recording of meeting.recording_files) {
        try {
          if (
            await meetingDir.getFileHandle(
              `${recording.id}.${recording.file_extension}`
            )
          ) {
            continue;
          }
        } catch (error) {}

        const recordingFileHandle = await meetingDir.getFileHandle(
          `${recording.id}.${recording.file_extension}`,
          {
            create: true,
          }
        );

        const response = await fetch(
          `https://free-cors-bypass.herokuapp.com/${recording.download_url}?access_token=${jwtInput.value}`
        );

        console.log("HERE3");
        await response.body.pipeTo(await recordingFileHandle.createWritable());
      }
    }
  } while (pageToken);
};
