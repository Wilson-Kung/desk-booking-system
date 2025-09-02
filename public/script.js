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

    if (new Date(start) >= new Date(end)) {
      message.textContent = 'End time must be later than start time';
      return;
    }

     const isSameDay = startDate.toISOString().split('T')[0] === endDate.toISOString().split('T')[0];

    if (!isStartTimeValid || !isEndTimeValid) {
      message.textContent = 'Appointment time must be between 9:00 AM and 5:45 PM every day';
      return;
    }

    if (!isDateValid) {
      message.textContent = 'Appointment date must be between today and the next 30 days';
      return;
    }

    if (!isSameDay) {
      message.textContent = 'Start and end times must be on the same day';
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
