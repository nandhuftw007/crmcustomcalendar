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

function populateCalendarBody(schedules) {
    let tbody = document.querySelector('#calendarTable tbody');
    tbody.innerHTML = ""; // Clear any existing rows

    const weekDates = getWeekDates(new Date(currentDate));
    const weekStartDate = new Date(weekDates[0]);
    const weekEndDate = new Date(weekDates[weekDates.length - 1]);
    weekEndDate.setHours(23, 59, 59, 999);

    schedules.forEach(schedule => {
        let tempName = schedule.Schedule_For_Temp ? schedule.Schedule_For_Temp.name : "No Name";
        let jobName = schedule.Job ? schedule.Job.name : "No Job Assigned";
        let daysInWeek = schedule.Days_in_the_Week; // Get the Days_in_the_Week field

        let row = document.createElement('tr');

        let rowHeader = document.createElement('td');
        rowHeader.className = 'rowHeader';
        rowHeader.innerText = tempName;
        row.appendChild(rowHeader);

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

        weekDates.forEach(dateString => {
            let cell = document.createElement('td');
            cell.className = 'cell';
            cell.dataset.time = `${dateString}, ${tempName}`;

            let cellDate = new Date(dateString);
            cellDate.setHours(0, 0, 0, 0); // Set the time component to the start of the day

            let dayOfWeek = getDayOfWeek(cellDate.getDay());

            // Check if the current cell date is within the start and end date-time range
            if (selectedDays.includes(dayOfWeek)) {
                if (startDateTime <= cellDate && endDateTime >= cellDate) {
                    let startTimeString = formatTimeTo12Hour(startDateTime);
                    let endTimeString = formatTimeTo12Hour(endDateTime);

                    if (cellDate.toDateString() === startDateTime.toDateString()) {
                        cell.innerHTML = `<p>${jobName}</p><p>${startTimeString} - ${endTimeString}</p>`;
                    } else if (cellDate.toDateString() === endDateTime.toDateString()) {
                        cell.innerHTML = `<p>${jobName}</p><p>${startTimeString} - ${endTimeString}</p>`;
                    } else if (cellDate > startDateTime && cellDate < endDateTime) {
                        cell.innerHTML = `<p>${jobName}</p><p>${startTimeString} - ${endTimeString}</p>`;
                    }
                }

                // Display the start time and end time on the previous day of the start date
                if (cellDate.toDateString() === prevDayDateTime.toDateString()) {
                    let startTimeString = formatTimeTo12Hour(startDateTime);
                    let endTimeString = formatTimeTo12Hour(endDateTime);
                    cell.innerHTML = `<p>${jobName}</p><p>${startTimeString} - ${endTimeString}</p>`;
                }
            }

            row.appendChild(cell);
        });

        tbody.appendChild(row);
    });
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
