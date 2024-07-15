let currentDate = new Date();
let today = new Date();

// Function to get the week's dates based on a given date
function getWeekDates(date) {
    const firstDayOfWeek = date.getDate() - date.getDay(); // Sunday as the first day of the week
    let weekDates = [];
    for (let i = 0; i < 7; i++) {
        let day = new Date(date);
        day.setDate(firstDayOfWeek + i);
        weekDates.push(day.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
    }
    return weekDates;
}

// Populate the calendar header with the week's dates
function populateCalendarHeader() {
    const weekDates = getWeekDates(new Date(currentDate));
    const calendarHeader = document.getElementById('calendarHeader');

    // Clear any existing headers
    while (calendarHeader.firstChild) {
        calendarHeader.removeChild(calendarHeader.firstChild);
    }

    // Add corner cell
    const cornerCell = document.createElement('th');
    cornerCell.className = 'corner';
    calendarHeader.appendChild(cornerCell);

    // Add date headers
    weekDates.forEach(date => {
        const dateHeader = document.createElement('th');
        dateHeader.className = 'colHeader';
        dateHeader.innerText = date;
        calendarHeader.appendChild(dateHeader);
    });
}

function formatTimeTo12Hour(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

function getDayOfWeek(dayIndex) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
}

function createThreeDotsButton() {
    let threeDotsButton = document.createElement('button');
    threeDotsButton.className = 'three-dots-button';
    threeDotsButton.innerText = '...';
    return threeDotsButton;
}

function createUnavailabilityOptions() {
    let options = document.createElement('div');
    options.className = 'unavailability-options';
    options.style.display = 'none';

    let allDayButton = document.createElement('button');
    allDayButton.innerText = 'Mark Unavailable (All Day)';
    allDayButton.addEventListener('click', function() {
        alert('Marked Unavailable for the Entire Day');
        options.style.display = 'none';
    });

    let specificTimeButton = document.createElement('button');
    specificTimeButton.innerText = 'Mark Unavailable (Specific Time)';
    specificTimeButton.addEventListener('click', function() {
        let startTimeInput = document.createElement('input');
        startTimeInput.type = 'time';
        startTimeInput.placeholder = 'Start Time';

        let endTimeInput = document.createElement('input');
        endTimeInput.type = 'time';
        endTimeInput.placeholder = 'End Time';

        let confirmButton = document.createElement('button');
        confirmButton.innerText = 'Confirm';
        confirmButton.addEventListener('click', function() {
            // Handle specific time period unavailability marking here
            let startTime = startTimeInput.value;
            let endTime = endTimeInput.value;
            if (startTime && endTime) {
                alert(`Marked Unavailable from ${startTime} to ${endTime}`);
                options.style.display = 'none';
            } else {
                alert('Please select both start and end times.');
            }
        });

        options.appendChild(startTimeInput);
        options.appendChild(endTimeInput);
        options.appendChild(confirmButton);
    });

    options.appendChild(allDayButton);
    options.appendChild(specificTimeButton);

    return options;
}

function handleThreeDotsButtonClick(event) {
    let options = event.target.parentElement.querySelector('.unavailability-options');
    if (options.style.display === 'none' || options.style.display === '') {
        options.style.display = 'block';
    } else {
        options.style.display = 'none';
    }
}

function populateCalendarBody(schedules) {
    let tbody = document.querySelector('#calendarTable tbody');
    tbody.innerHTML = ""; // Clear any existing rows

    const weekDates = getWeekDates(new Date(currentDate));
    const weekStartDate = new Date(weekDates[0]);
    const weekEndDate = new Date(weekDates[weekDates.length - 1]);
    weekEndDate.setHours(23, 59, 59, 999);

    // Aggregate schedules by temp name
    let aggregatedSchedules = {};
    schedules.forEach(schedule => {
        let tempName = schedule.Schedule_For_Temp ? schedule.Schedule_For_Temp.name : "No Name";
        if (!aggregatedSchedules[tempName]) {
            aggregatedSchedules[tempName] = [];
        }
        aggregatedSchedules[tempName].push(schedule);
    });

    // Populate the calendar body
    for (let tempName in aggregatedSchedules) {
        let row = document.createElement('tr');

        let rowHeader = document.createElement('td');
        rowHeader.className = 'rowHeader';
        rowHeader.innerText = tempName;
        row.appendChild(rowHeader);

        let tempSchedules = aggregatedSchedules[tempName];

        weekDates.forEach(dateString => {
            let cell = document.createElement('td');
            cell.className = 'cell';
            cell.dataset.time = `${dateString}, ${tempName}`;

            let cellDate = new Date(dateString);
            cellDate.setHours(0, 0, 0, 0); // Set the time component to the start of the day

            let dayOfWeek = getDayOfWeek(cellDate.getDay());

            tempSchedules.forEach(schedule => {
                let jobName = schedule.Job ? schedule.Job.name : "No Job Assigned";
                let daysInWeek = schedule.Days_in_the_Week;

                // Parse the start and end date-time strings
                let startDateTime = new Date(schedule.Start_Date_and_Work_Start_Time);
                let endDateTime = new Date(schedule.End_Date_and_Work_End_Time);

                // Calculate the date for the previous day of the start date
                let prevDayDateTime = new Date(startDateTime);
                prevDayDateTime.setDate(prevDayDateTime.getDate() - 0);

                // Get the days of the week selected
                let selectedDays = [];
                if (daysInWeek.includes('Daily')) {
                    selectedDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                } else if (daysInWeek.includes('Weekdays')) {
                    selectedDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
                } else {
                    selectedDays = daysInWeek; // Use the selected days
                }

                // Check if the current cell date is within the start and end date-time range
                if (selectedDays.includes(dayOfWeek)) {
                    if (startDateTime <= cellDate && endDateTime >= cellDate) {
                        let startTimeString = formatTimeTo12Hour(startDateTime);
                        let endTimeString = formatTimeTo12Hour(endDateTime);

                        if (cellDate.toDateString() === startDateTime.toDateString()) {
                            cell.innerHTML += `<div class="schedule-box"><p>${jobName}</p><p>${startTimeString} - ${endTimeString}</p></div>`;
                        } else if (cellDate.toDateString() === endDateTime.toDateString()) {
                            cell.innerHTML += `<div class="schedule-box"><p>${jobName}</p><p>${startTimeString} - ${endTimeString}</p></div>`;
                        } else if (cellDate > startDateTime && cellDate < endDateTime) {
                            cell.innerHTML += `<div class="schedule-box"><p>${jobName}</p><p>${startTimeString} - ${endTimeString}</p></div>`;
                        }
                    }

                    // Display the start time and end time on the previous day of the start date
                    if (cellDate.toDateString() === prevDayDateTime.toDateString()) {
                        let startTimeString = formatTimeTo12Hour(startDateTime);
                        let endTimeString = formatTimeTo12Hour(endDateTime);
                        cell.innerHTML += `<div class="schedule-box"><p>${jobName}</p><p>${startTimeString} - ${endTimeString}</p></div>`;
                    }
                }
            });

            // Add the three-dots button and unavailability options
            let threeDotsButton = createThreeDotsButton();
            threeDotsButton.addEventListener('click', handleThreeDotsButtonClick);
            cell.appendChild(threeDotsButton);

            let unavailabilityOptions = createUnavailabilityOptions();
            cell.appendChild(unavailabilityOptions);

            row.appendChild(cell);
        });

        tbody.appendChild(row);
    }
}

function fetchAndPopulateCalendar() {
    var conn_name = "crm";
    var req_data = {
        "method": "GET",
        "url": "https://www.zohoapis.com/crm/v2/Shift_Schedule",
        "param_type": 1
    };

    ZOHO.CRM.CONNECTION.invoke(conn_name, req_data)
    .then(function(response) {
        console.log(response);
        if (response.details && response.details.statusMessage && response.details.statusMessage.data.length > 0) {
            let schedules = response.details.statusMessage.data;
            populateCalendarBody(schedules);
        }
    })
    .catch(function(error) {
        console.error('Error invoking Zoho API:', error);
    });
}

ZOHO.embeddedApp.on("PageLoad", function(data) {
    populateCalendarHeader(); // Populate the calendar header on page load
    fetchAndPopulateCalendar();
});

ZOHO.embeddedApp.init();

document.getElementById('prevWeek').addEventListener('click', function() {
    currentDate.setDate(currentDate.getDate() - 7); // Move to the previous week
    populateCalendarHeader();
    fetchAndPopulateCalendar();
});

document.getElementById('nextWeek').addEventListener('click', function() {
    currentDate.setDate(currentDate.getDate() + 7); // Move to the next week
    populateCalendarHeader();
    fetchAndPopulateCalendar();
});

document.getElementById('currentWeek').addEventListener('click', function() {
    currentDate = new Date(today); // Reset to the current week
    populateCalendarHeader();
    fetchAndPopulateCalendar();
});

// Close unavailability options when clicking outside
document.addEventListener('click', function(event) {
    let options = document.querySelectorAll('.unavailability-options');
    options.forEach(option => {
        if (!option.contains(event.target) && !option.previousSibling.contains(event.target)) {
            option.style.display = 'none';
        }
    });
});

