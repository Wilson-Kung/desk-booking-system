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

    // 檢查時間是否在 09:00 至 17:45
    const startDate = new Date(start);
    const endDate = new Date(end);
    const startHour = startDate.getHours();
    const startMinute = startDate.getMinutes();
    const endHour = endDate.getHours();
    const endMinute = endDate.getMinutes();

    const isStartValid = (startHour > 9 || (startHour === 9 && startMinute >= 0)) && 
                        (startHour < 17 || (startHour === 17 && startMinute <= 45));
    const isEndValid = (endHour > 9 || (endHour === 9 && endMinute >= 0)) && 
                      (endHour < 17 || (endHour === 17 && endMinute <= 45));

    if (!isStartValid || !isEndValid) {
      message.textContent = 'Appointments must be made between 9:00 a.m. and 5:45 p.m.';
      return;
    }

    if (startDate >= endDate) {
      message.textContent = 'End time must be later than start time';
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
      message.textContent = '預約成功！';
      calendar.refetchEvents(); // 重新載入日曆
      form.reset();
    })
    .catch(err => {
      message.textContent = err.error || 'Appointment failed';
    });
  });
});
      message.textContent = err.error || 'Appointment failed';
    });
  });
});
