document.addEventListener('DOMContentLoaded', function() {
  const calendarEl = document.getElementById('calendar');
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'timeGridWeek', // 週視圖，顯示時間段
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    editable: false, // 不允許拖拽編輯
    events: loadEvents // 載入事件
  });
  calendar.render();

 // 載入事件從後端
  function loadEvents(fetchInfo, successCallback, failureCallback) {
    fetch('/api/bookings')
      .then(response => response.json())
      .then(data => {
        const events = data.map(booking => ({
          title: booking.name,
          start: booking.start,
          end: booking.end,
          allDay: false
        }));
        successCallback(events);
      })
      .catch(error => failureCallback(error));
  }

  // 表單提交
  const form = document.getElementById('booking-form');
  const message = document.getElementById('message');
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const start = document.getElementById('start').value;
    const end = document.getElementById('end').value;

    const startDate = new Date(start);
    const endDate = new Date(end);
    const today = new Date();
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 30);

    // 檢查時間是否在 09:00 至 17:45
    const startHour = startDate.getHours();
    const startMinute = startDate.getMinutes();
    const endHour = endDate.getHours();
    const endMinute = endDate.getMinutes();

    const isStartTimeValid = (startHour > 9 || (startHour === 9 && startMinute >= 0)) && 
                            (startHour < 17 || (startHour === 17 && startMinute <= 45));
    const isEndTimeValid = (endHour > 9 || (endHour === 9 && endMinute >= 0)) && 
                          (endHour < 17 || (endHour === 17 && endMinute <= 45));

    // 檢查日期是否在今天到未來 30 天
    const isDateValid = startDate >= today && startDate <= maxDate && endDate >= today && endDate <= maxDate;

    // 檢查是否在同一天
    const isSameDay = startDate.toISOString().split('T')[0] === endDate.toISOString().split('T')[0];

    if (!isStartTimeValid || !isEndTimeValid) {
      message.textContent = 'Appointments must be made between 9:00 AM and 5:45 PM daily.';
      return;
    }

    if (!isDateValid) {
      message.textContent = 'Appointment dates must be between today and the next 30 days.';
      return;
    }

    if (!isSameDay) {
      message.textContent = 'The start and end times must be on the same day.';
      return;
    }

    if (startDate >= endDate) {
      message.textContent = 'The end time must be after the start time.';
      return;
    }

    fetch('/api/bookings-post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, start, end })
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => { throw err; });
      }
      return response.json();
    })
    .then(() => {
      message.textContent = 'Appointment successful！';
      calendar.refetchEvents(); // 重新載入日曆
      form.reset();
    })
    .catch(err => {
      message.textContent = err.error || 'Appointment failed';
    });
  });
});
