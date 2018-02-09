((glob) => {

  const prevSVG = `<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Previous Month</title><path d="M14.422 16.078l-1.406 1.406-6-6 6-6 1.406 1.407-4.594 4.593z" fill="#8FCB14" fill-rule="evenodd"/></svg></button>`;
  const nextSVG = `<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Next Month</title><path d="M8.578 16.36l4.594-4.594-4.594-4.594 1.406-1.406 6 6-6 6z" fill="#8FCB14" fill-rule="evenodd"/></svg>`;

  class DatePicker {

    constructor(customClass) {
      this.customClass = customClass
      this.init()
    }

    init() {
      if(this.initialized)
        return false

      this.initialized = true

      this.setupHooks()
    }

    setupHooks() {

      const prevClick = (evt) => {

        if(evt && evt.preventDefault)
          evt.preventDefault()
        
        let calendar = this.getCalendar()
        let currentString = calendar.dataset.current.split('-')
        let current = new Date(currentString[0], currentString[1])

        let previous = new Date(current.getFullYear(), current.getMonth() - 1)

        let newDates = this.drawDates(this.getDaysArrayByMonth(previous))
        let currentDates = document.querySelector('#dz-calendar .dz-dates')
        
        calendar.insertAdjacentHTML('beforeEnd', newDates)
        newDates = calendar.children[calendar.children.length-1]
        
        calendar.removeChild(currentDates)
        
        let year = previous.getFullYear()
        let month = previous.getMonth()
        
        calendar.dataset.current = `${year} - ${month}`
        calendar.children[0].children[0].innerHTML = `${this.getMonthName(month)}, ${year}`
        
        hookDates()

        return false

      }
      
      const nextClick = (evt) => {

        if(evt && evt.preventDefault)
          evt.preventDefault()
        
        let calendar = this.getCalendar()
        let currentString = calendar.dataset.current.split('-')
        let current = new Date(currentString[0], currentString[1])
        
        let next = new Date(current.getFullYear(), current.getMonth() + 1)

        let newDates = this.drawDates(this.getDaysArrayByMonth(next))
        let currentDates = document.querySelector('#dz-calendar .dz-dates')
        
        calendar.insertAdjacentHTML('beforeEnd', newDates)
        newDates = calendar.children[calendar.children.length-1]
        
        calendar.removeChild(currentDates)
        
        let year = next.getFullYear()
        let month = next.getMonth()
        
        calendar.dataset.current = `${year} - ${month}`
        calendar.children[0].children[0].innerHTML = `${this.getMonthName(month)}, ${year}`
        
        hookDates()

        return false

      }
      
      this.bodyClick = (evt) => {

        let calendar = this.getCalendar()

        if(calendar)
          if(!calendar.classList.contains('active'))
            document.body.removeChild(calendar)
          else if(!this.isInCalendar(evt.target)) {
            return this.cleanupCalendar(evt, calendar)
        }
      }
      
      const dateClick = (evt) => {
        
        let calendar = this.getCalendar()
        let date = parseInt(evt.target.innerHTML)

        let currentString = calendar.dataset.current.split('-')
        date = new Date(currentString[0],currentString[1],date)

        let fn = window[this.source.dataset.onset]
        if(fn) 
          fn(date)

        // zero pad the month if needed
        let month = date.getMonth() + 1
        if(month.toString().length === 1)
          month = "0" + month
        // zero pad the date if needed
        let dateStr = date.getDate()
        if(dateStr.toString().length === 1)
          dateStr = "0" + dateStr

        let val = [date.getFullYear(), month, dateStr].join('-')

        if(this.source.nodeName === 'INPUT') {
          this.source.value = val
          if ('InputEvent' in window)
            this.source.dispatchEvent(new InputEvent('input'))
          else
            this.source.dispatchEvent(new Event('input'))
        }
        else if(this.source.dataset.dateVal)
          this.source.dataset.dateVal = val
        
        if (this.callback)
          this.callback(this.source, val)

        return this.cleanupCalendar(evt, calendar)
        
      }
      
      const hookDates = () => {
        
        let calendar = this.getCalendar()
        if(!calendar)
          return
           
        let dates = Array.prototype.slice.call(document.querySelectorAll('#dz-calendar .dz-dates div'))
        dates.forEach((item) => {
          if(!item.classList.contains('disabled'))
            item.addEventListener('click', dateClick, false)
        })
        
      }

      const triggerClick = (evt) => {
        
        // check if calendar is already being shown
        let phantom = this.getCalendar()
        
        if(phantom) {
          this.cleanupCalendar(evt, phantom)
          setTimeout(() => {
            triggerClick(evt)
          }, 300)
          return false
        }

        let rect = evt.target.getBoundingClientRect()
        let center = {
          x: rect.left + (rect.width / 2),
          y: rect.top + rect.height
        }

        let target = evt.target.nodeName === "INPUT" ? 
                      evt.target : 
                      findParent(evt.target, this.customClass || 'date-trigger')

        this.source = target

        let calendar = this.drawCalendar()

        document.body.insertAdjacentHTML('beforeEnd', calendar)

        calendar = document.getElementById('dz-calendar')
        
        // position the calendar near the origin point
        let calendarRect = calendar.getBoundingClientRect()
        
        // the width before showing = actual width * 0.25 
        let width = calendarRect.width * 4

        calendar.style.left = (center.x - width/2) + 'px'
        calendar.style.top = (center.y + 16) + 'px'

        let prev = calendar.children[0].children[1]
        let next = calendar.children[0].children[2]

        prev.addEventListener('click', prevClick, false)
        next.addEventListener('click', nextClick, false)

        calendar.classList.add('active')
        this.source.setAttribute("aria-expanded", "true")
        if (this.source.hasAttribute("id")) {
            calendar.setAttribute("aria-describedby", this.source.getAttribute("id"))
          }
           
        hookDates()

        let fn = 'didShowDatePicker'
        if(window[fn])
          window[fn](calendar)
           
        setTimeout(() => {
          // this needs to be added a second later to prevent ghost click
          document.body.addEventListener('click', this.bodyClick, false)
        }, 500)

        return false

      }

      let triggers = document.querySelectorAll(this.customClass ? "." + this.customClass : '.date-trigger')
      triggers = Array.prototype.slice.call(triggers)

      const attachTrigger = (elem) => {
        if(!elem) return
        elem.addEventListener('click', triggerClick, false)
        if(elem.nodeName === "INPUT") {
          elem.addEventListener('focus', inputFocus, false)
          elem.addEventListener('blur', inputBlur, false)
          elem.setAttribute("aria-haspopup", "true")
          elem.setAttribute("aria-expanded", "false")
        }
      }

      triggers.forEach((item) => {
        attachTrigger(item)
      })

      glob.attachDateTrigger = attachTrigger

    }

    getCalendar() {
      return document.getElementById("dz-calendar")
    }

    isInCalendar(elem) {
      let parent = findParent(elem, 'dz-calendar')
      return parent !== document.body && parent != undefined
    }

    getMonthName(idx) {
      return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].splice(idx, 1)
    }

    getFullMonthName(idx) {
      return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].splice(idx, 1)
    }

    getDaysArrayByMonth(date) {
      
      let year = date.getFullYear()
      let month = date.getMonth()
      let monthRange = new Date(year, month + 1, 0).getDate()
      let days = []

      while(monthRange > 0) {
        days.push(new Date(year, month, monthRange))
        monthRange--;
      }

      return days.reverse()
    }

    drawDates(dates) {

      let now = new Date()

      if(this.source.nodeName === 'INPUT' && this.source.value)
        now = new Date(this.source.value)
      else if (this.source.dataset.dateVal)
        now = new Date(this.source.dataset.dateVal)
      
      let markup = `<div class="dz-dates">`
      let calendar = this.getCalendar()
      
      let {dateMax, dateMin} = this.source.dataset
      
      if(dateMax)
        dateMax = new Date(dateMax)
      if(dateMin)
        dateMin = new Date(dateMin)

      let val = null
      if(this.source.nodeName === 'INPUT')
        val = new Date(this.source.value)
      else if (this.source.dataset.dateVal)
        val = new Date(this.source.dataset.dateVal)

      // find offset of first date.
      let offsetDay = dates[0].getDay()
      
      const dateEqual = (base, compare) => base.getDate() === compare.getDate() && base.getMonth() === compare.getMonth() && base.getYear() == compare.getYear()

      dates.forEach((date, idx) => {

        let classes = [];
        
        // check if the date is today
        if (dateEqual(now, date))
          classes.push('today')

        // check if this is the selected value
        if(val && dateEqual(date, val))
          classes.push('selected')
          
        // check if the date is within the min range, if one is set
        if(dateMin && (dateMin.getTime() - date.getTime()) > 0)
          classes.push('disabled')
          
        // check if the date is within the max range, if one is set
        if(dateMax && (dateMax.getTime() - date.getTime()) < 0)
          classes.push('disabled')
          
        classes = classes.join(' ')

        let ariaString = date.toDateString()
        ariaString = [ariaString.substr(0,3), ariaString.substr(4)]
        ariaString[0] += "day, "

        ariaString[1] = [ariaString[1].substr(0,3), ariaString[1].substr(4)]
        ariaString[1][0] = this.getFullMonthName(date.getMonth())
        ariaString[1] = ariaString[1].join(" ")
        ariaString = ariaString.join("")

        if (idx !== 0)
          markup += `<div role="link" aria-label="${ariaString}" class="${classes}">${date.getDate()}</div>`
        else
          markup += `<div style="margin-left:${offsetDay * 35}px;" role="link" aria-label="${ariaString}" class="${classes}">${date.getDate()}</div>`

      })

      markup += `</div>`

      return markup

    }

    drawCalendar() {

      let now = new Date()

      let year = now.getFullYear()
      let month = now.getMonth()
      
      let dates = this.getDaysArrayByMonth(now)
      let days = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
      
      let markup = `<div id="dz-calendar" class="inline-container" data-current="${year}-${month}"  role="dialog" aria-label="Calendar">
        <div class="dz-title"> 
           <h4 aria-role="Presentation" aria-label="${this.getFullMonthName(now.getMonth())}, ${now.getFullYear()}">${this.getMonthName(now.getMonth())}, ${now.getFullYear()}</h4>
           <button id="dz-prev" aria-label="Previous Month" title="Previous Month">${prevSVG}</button>
           <button id="dz-next" aria-label="Next Month" title="Next Month">${nextSVG}</button>
        </div>
        <div class="dz-days">`

      days.forEach((day) => {
        markup += `<div>${day}</div>`
      })

      markup += `</div>
        ${this.drawDates(dates)}
      </div>`

      return markup
    }

    cleanupCalendar(evt, calendar) {

      if(evt && evt.preventDefault)
        evt.preventDefault()
      
      if(calendar) {
        
        calendar.classList.remove('active')
        
        setTimeout(() => {
          if (calendar && calendar.parentNode)
            calendar.parentNode.removeChild(calendar)
          this.source = undefined
        }, 300)
        
      }

      if (this.source) {
        console.log(this.source)
        this.source.setAttribute("aria-expanded", "false")
        console.log(this.source.getAttribute("aria-expanded"))
      }

      document.body.removeEventListener('click', this.bodyClick, false)

      return false

    }

  }

  if(glob && glob.exports)
    glob.exports = Object.assign({}, {
      'DatePicker': DatePicker,
      'datePicker': new DatePicker()
    })

  else {
    glob.DatePicker = DatePicker
    glob.datePicker = new DatePicker()
  }

})(typeof module === "undefined" ? window : module);