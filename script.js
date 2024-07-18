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

function createUnavailabilityOptions(tempId, cellDate) {
    let options = document.createElement('div');
    options.className = 'unavailability-options';
    options.style.display = 'none';

    let allDayButton = document.createElement('button');
    allDayButton.innerText = 'Mark Unavailable (All Day)';
    allDayButton.dataset.tempId = tempId;
    allDayButton.dataset.cellDate = cellDate;
    allDayButton.addEventListener('click', function() {
        insertTimeOffRecord(this.dataset.tempId, this.dataset.cellDate);
        options.style.display = 'none';
    });
    options.appendChild(allDayButton);

    let hourlyButton = document.createElement('button');
    hourlyButton.innerText = 'Mark Unavailable (Hourly)';
    hourlyButton.dataset.tempId = tempId;
    hourlyButton.dataset.cellDate = cellDate;
    hourlyButton.addEventListener('click', function() {
        markUnavailableHourly(this.dataset.tempId, this.dataset.cellDate);
        options.style.display = 'none';
    });
    options.appendChild(hourlyButton);

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

function populateCalendarBody(schedules, timeOffRecords) {
    let tbody = document.querySelector('#calendarTable tbody');
    tbody.innerHTML = ""; // Clear any existing rows

    const weekDates = getWeekDates(new Date(currentDate));
    const weekStartDate = new Date(weekDates[0]);
    const weekEndDate = new Date(weekDates[weekDates.length - 1]);
    weekEndDate.setHours(23, 59, 59, 999); // Set the end date to the last millisecond of the day

    let aggregatedSchedules = {};
    schedules.forEach(schedule => {
        if (schedule.Schedule_For_Temp && schedule.Schedule_For_Temp.name && schedule.Schedule_For_Temp.id) {
            let tempName = schedule.Schedule_For_Temp.name;
            let tempId = schedule.Schedule_For_Temp.id;
            if (!aggregatedSchedules[tempName]) {
                aggregatedSchedules[tempName] = { id: tempId, schedules: [] };
            }
            aggregatedSchedules[tempName].schedules.push(schedule);
        }
    });

    for (let tempName in aggregatedSchedules) {
        let row = document.createElement('tr');
        let rowHeader = document.createElement('td');
        rowHeader.className = 'rowHeader';
        rowHeader.innerText = `${tempName} (${aggregatedSchedules[tempName].id})`;
        row.appendChild(rowHeader);

        let tempSchedules = aggregatedSchedules[tempName].schedules;
        weekDates.forEach(dateString => {
            let cell = document.createElement('td');
            cell.className = 'cell';
            cell.dataset.time = `${dateString}, ${tempName}`;
            let cellDate = new Date(dateString);
            cellDate.setHours(0, 0, 0, 0);
            let dayOfWeek = getDayOfWeek(cellDate.getDay());
        
            // Check for unavailability records
            let unavailabilityRecord = timeOffRecords.find(record => {
                if (record.Unavailability === 'All Day' && record.Unavailable_day === moment(cellDate).format('YYYY-MM-DD') && record.Name1.id === aggregatedSchedules[tempName].id) {
                    return true;
                } else if (record.Unavailability === 'Hourly' && moment(record.From_Date_Time).format('YYYY-MM-DD') === moment(cellDate).format('YYYY-MM-DD') && record.Name1.id === aggregatedSchedules[tempName].id) {
                    return true;
                }
                return false;
            });
        
            if (unavailabilityRecord) {
                if (unavailabilityRecord.Unavailability === 'All Day') {
                    cell.innerHTML = "Unavailable All Day";
                    cell.classList.add('unavailable');
                } else if (unavailabilityRecord.Unavailability === 'Hourly') {
                    let startTimeString = moment(unavailabilityRecord.From_Date_Time).format('hh:mm a');
                    let endTimeString = moment(unavailabilityRecord.To_Date).format('hh:mm a');
                    cell.innerHTML = `Unavailable (${startTimeString} - ${endTimeString})`;
                    cell.classList.add('unavailable');
                }
            } else {
                // Render schedules
                let scheduleHtml = '';
                tempSchedules.forEach(schedule => {
                    if (schedule.Schedule_For_Temp && schedule.Schedule_For_Temp.name && schedule.Schedule_For_Temp.id) {
                        let jobName = schedule.Job ? schedule.Job.name : "No Job Assigned";
                        let daysInWeek = schedule.Days_in_the_Week;
                        let startDateTime = new Date(schedule.Start_Date_and_Work_Start_Time);
                        let endDateTime = new Date(schedule.End_Date_and_Work_End_Time);
                        let prevDayDateTime = new Date(startDateTime);
                        prevDayDateTime.setDate(prevDayDateTime.getDate() - 0); // Adjust to check previous day
        
                        let selectedDays = [];
                        if (daysInWeek.includes('Daily')) {
                            selectedDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                        } else if (daysInWeek.includes('Weekdays')) {
                            selectedDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
                        } else {
                            selectedDays = daysInWeek;
                        }
        
                        if (selectedDays.includes(dayOfWeek)) {
                            if (startDateTime <= cellDate && endDateTime >= cellDate) {
                                let startTimeString = formatTimeTo12Hour(startDateTime);
                                let endTimeString = formatTimeTo12Hour(endDateTime);
                                if (cellDate.toDateString() === startDateTime.toDateString()) {
                                    scheduleHtml += `<div class="schedule-box"><p>${jobName}</p><p>${startTimeString} - ${endTimeString}</p></div>`;
                                } else if (cellDate > startDateTime && cellDate < endDateTime) {
                                    scheduleHtml += `<div class="schedule-box"><p>${jobName}</p><p>${startTimeString} - ${endTimeString}</p></div>`;
                                }
                            }
        
                            if (cellDate.toDateString() === prevDayDateTime.toDateString()) {
                                let startTimeString = formatTimeTo12Hour(startDateTime);
                                let endTimeString = formatTimeTo12Hour(endDateTime);
                                scheduleHtml += `<div class="schedule-box"><p>${jobName}</p><p>${startTimeString} - ${endTimeString}</p></div>`;
                            }
                        }
                    }
                });
        
                cell.innerHTML = scheduleHtml;
        
                let threeDotsButton = createThreeDotsButton();
                threeDotsButton.addEventListener('click', handleThreeDotsButtonClick);
                cell.appendChild(threeDotsButton);
        
                let unavailabilityOptions = createUnavailabilityOptions(aggregatedSchedules[tempName].id, cellDate);
                cell.appendChild(unavailabilityOptions);
            }
        
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
            console.log("Fetched schedules:", schedules); // Log fetched schedules
            fetchTimeOffRecords(schedules);
        } else {
            console.log("No schedules found.");
            populateCalendarBody([], []); // Populate with empty data
        }
    })
    .catch(function(error) {
        console.error('Error invoking Zoho API:', error);
        // Handle error case, e.g., display an error message
    });
}



function fetchTimeOffRecords(schedules) {
    ZOHO.CRM.API.getAllRecords({ Entity: "Time_Off", sort_order: "desc", per_page: 200 })
    .then(function(response) {
        console.log("Time Off Records: ", response);
        if (response.data && response.data.length > 0) {
            populateCalendarBody(schedules, response.data);
        } else {
            populateCalendarBody(schedules, []);
        }
    })
    .catch(function(error) {
        console.error('Error fetching Time Off records:', error);
        populateCalendarBody(schedules, []);
    });
}

// Function to insert a record
function insertTimeOffRecord(tempId, cellDate) {
    let formattedCellDate = moment(cellDate).format('YYYY-MM-DD');
    var recordData = {
        "Name1": tempId,
        "Unavailability": "All Day",
        "Unavailable_day": formattedCellDate // Include the specific day here
    };
    console.log(recordData);

    ZOHO.CRM.API.insertRecord({ Entity: "Time_Off", APIData: recordData, Trigger: [] })
    .then(function(data) {
        console.log("Insert Response: ", data);
        if (data.data && data.data.length > 0 && data.data[0].code === "SUCCESS") {
            alert("Record created successfully!");
            updateCellForUnavailability(tempId, cellDate);
        } else {
            alert("Failed to create record: " + (data.data[0].message || "Unknown error"));
        }
    })
    .catch(function(error) {
        console.error('Error inserting record:', error);
        alert('An error occurred while creating the record. Check the console for details.');
    });
}

function updateCellForHourlyUnavailability(tempId, cellDate, startTime, endTime) {
    let formattedCellDate = moment(cellDate).format('YYYY-MM-DD');
    let formattedStartTime = moment(`${formattedCellDate} ${startTime}`, 'YYYY-MM-DD HH:mm').format('YYYY-MM-DDTHH:mm:ss');
    let formattedEndTime = moment(`${formattedCellDate} ${endTime}`, 'YYYY-MM-DD HH:mm').format('YYYY-MM-DDTHH:mm:ss');
  
    var recordData = {
      "Name1": tempId,
      "Unavailability": "Hourly",
      "From_Date_Time": formattedStartTime,
      "To_Date": formattedEndTime
    };
    console.log(recordData);
    ZOHO.CRM.API.insertRecord({ Entity: "Time_Off", APIData: recordData, Trigger: [] })
      .then(function (data) {
        console.log("Insert Response: ", data);
        if (data.data && data.data.length > 0 && data.data[0].code === "SUCCESS") {
          alert("Hourly Unavailability Record created successfully!");
          updateCellForUnavailability(tempId, cellDate);
        } else {
          alert("Failed to create Hourly Unavailability Record: " + (data.data[0].message || "Unknown error"));
        }
      })
      .catch(function (error) {
        console.error('Error inserting Hourly Unavailability Record:', error);
        alert('An error occurred while creating the Hourly Unavailability Record. Check the console for details.');
      });
  }
  
  function updateCellForUnavailability(tempId, cellDate) {
    let cell = document.querySelector(`td[data-time*='${moment(cellDate).format('MMM D, YYYY')}']`);
    if (cell) {
        // Fetch both hourly and all-day unavailability records
        Promise.all([
            ZOHO.CRM.API.getRecord({ Entity: "Time_Off", Criteria: `Name1=${tempId} AND Unavailability='Hourly' AND From_Date_Time='${moment(cellDate).format('YYYY-MM-DD')} 00:00:00'` }),
            ZOHO.CRM.API.getRecord({ Entity: "Time_Off", Criteria: `Name1=${tempId} AND Unavailability='All Day' AND Unavailable_day='${moment(cellDate).format('YYYY-MM-DD')}'` })
        ])
        .then(([hourlyResponse, allDayResponse]) => {
            let hourlyRecord = hourlyResponse.data && hourlyResponse.data.length > 0 ? hourlyResponse.data[0] : null;
            let allDayRecord = allDayResponse.data && allDayResponse.data.length > 0 ? allDayResponse.data[0] : null;

            if (allDayRecord) {
                // Display "Unavailable All Day"
                cell.innerHTML = "Unavailable All Day";
                cell.classList.add('unavailable'); // Mark the cell as unavailable
            } else if (hourlyRecord) {
                // Display "Unavailable (start time - end time)"
                let startTime = moment(hourlyRecord.From_Date_Time).format('hh:mm a');
                let endTime = moment(hourlyRecord.To_Date).format('hh:mm a');
                cell.innerHTML = `Unavailable (${startTime} - ${endTime})`;
                cell.classList.add('unavailable'); // Mark the cell as unavailable
            } else {
                // Clear the cell if no unavailability records found
                cell.innerHTML = "";
                cell.classList.remove('unavailable');
            }
        })
        .catch(error => {
            console.error('Error fetching unavailability records:', error);
            cell.innerHTML = ""; // Clear the cell on error
            cell.classList.remove('unavailable');
        });
    }
}




// Function to handle hourly unavailability
function markUnavailableHourly(tempId, cellDate) {
    const cell = document.querySelector(`td[data-time*='${moment(cellDate).format('MMM D, YYYY')}']`);
    if (cell) {
      // Create a small popup
      const popup = document.createElement('div');
      popup.className = 'hourly-unavailability-popup';
      popup.innerHTML = `
        <input type="date" id="unavailable-date" value="${moment(cellDate).format('YYYY-MM-DD')}">
        <input type="time" id="unavailable-start-time">
        <input type="time" id="unavailable-end-time">
        <button id="save-hourly-unavailability" style="font-size: 12px;">Save</button>
        <button id="cancel-hourly-unavailability" style="font-size: 12px;">Cancel</button>
      `;
      cell.appendChild(popup);
  
      // Add event listeners
      document.getElementById('save-hourly-unavailability').addEventListener('click', () => {
        const date = document.getElementById('unavailable-date').value;
        const startTime = document.getElementById('unavailable-start-time').value;
        const endTime = document.getElementById('unavailable-end-time').value;
  
        if (date && startTime && endTime) {
          updateCellForHourlyUnavailability(tempId, cellDate, startTime, endTime);
          popup.remove(); // Remove the popup
        } else {
          console.error('All fields are required.');
        }
      });
  
      document.getElementById('cancel-hourly-unavailability').addEventListener('click', () => {
        popup.remove(); // Remove the popup
      });
    }
  }

  $(document).ready(function() {
    // Initialize the Zoho CRM SDK
    ZOHO.embeddedApp.on("PageLoad", function(data) {
        populateCalendarHeader();
        fetchAndPopulateCalendar();
    });

    ZOHO.embeddedApp.init();

    document.getElementById('prevWeek').addEventListener('click', function() {
        currentDate.setDate(currentDate.getDate() - 7);
        populateCalendarHeader();
        fetchAndPopulateCalendar();
    });

    document.getElementById('nextWeek').addEventListener('click', function() {
        currentDate.setDate(currentDate.getDate() + 7);
        populateCalendarHeader();
        fetchAndPopulateCalendar();
    });

    document.getElementById('currentWeek').addEventListener('click', function() {
        currentDate = new Date(today);
        populateCalendarHeader();
        fetchAndPopulateCalendar();
    });

    // Close unavailability options when clicking outside
    document.addEventListener('click', function(event) {
        let options = document.querySelectorAll('.unavailability-options');
        options.forEach(option => {
            if (!option.contains(event.target) && !event.target.classList.contains('three-dots-button')) {
                option.style.display = 'none';
            }
        });
    });
});
