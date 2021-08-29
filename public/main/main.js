let state = false
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
    })
        .then((response) => {
            $("#meeting_topic_modal").html(meetingTopic);
            $("#meeting_type_modal").html(meetingType);
            $("#meeting_password_modal").html(meeting_password);
            $("#meeting_topic_share").html(meetingTopic);
            $("#meeting_type_share").html(meetingType);
            $("#meeting_description_share").html(meetingDescription);
            $("#meeting_password_share").html(meeting_password);
            $("#meeting_link_share").html(response.data);
            $('#modal-after-create').modal('show');
            $("#start-meeting").attr("onclick",`location.href='https://zooom-clone.atendimento205.repl.co/'${response.data};`);
        }, (error) => {
            console.log(error);
        });
}