let state = false
function isEmpty(str) {
    return (!str || str.length === 0 );
}
function ShowCreate() {
    if (!state) {
        $("#creation_of_meetings").removeClass('d-none');
        $("#down-icon").addClass('downRotate')
        state = true;
    } else {
        $("#creation_of_meetings").addClass('d-none');
        $("#down-icon").removeClass('downRotate')
        state = false
    }
}

function CreateAMeeting() {
    const meetingTopic = $("#cr_meeting_topic").val();
    const meetingType = $("#cr_meeting_type").val();
    const meetingDescription = $("#cr_meeting_desc").val();
    const meeting_password = $("#meeting_password").val();
    axios({
        method: 'post',
        url: '/create/meeting/',
        data: {
            topic: meetingTopic, 
            type: meetingType,
            pwd: meeting_password == "" ? null : meeting_password,
            desc: meetingDescription
        }
    })
        .then((response) => {
            console.log(response)
            $("#meeting_topic_modal").html(meetingTopic);
            $("#meeting_type_modal").html(meetingType);
            $("#meeting_password_modal").html(response.data.pwd);
            $("#meeting_topic_share").html(meetingTopic);
            $("#meeting_id_share").html(response.data.id);
            $("#meeting_type_share").html(meetingType);
            $("#meeting_description_share").html(meetingDescription);
            $("#meeting_password_share").html(response.data.pwd);
            $("#meeting_link_share").html(response.data.id);
            $('#modal-after-create').modal('show');
            $("#start-meeting").attr("onclick", `StartMeeting(${response.data.id})`);
        }, (error) => {
            console.log(error);
        });
}

function StartMeeting(ID){
    axios({
        method: 'post',
        url: `/meeting/start/${ID}`,
    })
    .then((response) => {
        window.location.replace(response.data);
    })
}

function JoinMeeting(){
    const id = $("#meeting_id").val();
    const pwd = $("#meeting_password").val();
    if(isEmpty(id) || isEmpty(pwd)) return alert("ID or Password cannot be empty");
    axios({
        method: 'post',
        url: '/join/meeting',
        data: {
            id: id,
            pwd: pwd
        }
    })
    .then((response) => {
        if(response.data != 500) window.location.replace(response.data);
        else return alert("Invalid Meeting ID or password!");
    })
}

function JoinSharedMeeting(){
    if(!LOGGED_IN) return alert("You are not logged in with your account");
    const id = MEETING_ID;
    const pwd = $("#password").val();
    if(isEmpty(id) || isEmpty(pwd)) return alert("ID or Password cannot be empty");
    axios({
        method: 'post',
        url: '/join/meeting',
        data: {
            id: id,
            pwd: pwd
        }
    })
    .then((response) => {
        return window.location.replace(response.data);
    }, (error) => {
        if(response.data != 500)  return alert("Invalid Meeting ID or password!");
    })
}