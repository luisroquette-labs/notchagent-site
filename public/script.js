(function () {
  var FORM_ORIGIN = 'https://cfgauss.com.br'
  var gate = document.getElementById('gate')
  var gateIframe = document.getElementById('gate-iframe')
  var subscribeIframe = document.getElementById('subscribe-iframe')
  var pendingDest = null
  var lastTrigger = null

  function abrirGate(dest, trigger) {
    pendingDest = dest
    lastTrigger = trigger || null
    if (gateIframe && !gateIframe.src && gateIframe.dataset.src) {
      gateIframe.src = gateIframe.dataset.src
    }
    if (gate) {
      gate.hidden = false
      var x = gate.querySelector('.gate-x')
      if (x) x.focus()
    }
  }

  function fecharGate() {
    if (gate) gate.hidden = true
    pendingDest = null
    if (lastTrigger && typeof lastTrigger.focus === 'function') lastTrigger.focus()
    lastTrigger = null
  }

  var gatilhos = document.querySelectorAll('[data-gate]')
  for (var i = 0; i < gatilhos.length; i++) {
    gatilhos[i].addEventListener('click', function (e) {
      e.preventDefault()
      abrirGate(this.dataset.dest, this)
    })
  }

  var fechadores = document.querySelectorAll('[data-gate-close]')
  for (var j = 0; j < fechadores.length; j++) {
    fechadores[j].addEventListener('click', fecharGate)
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && gate && !gate.hidden) fecharGate()
  })

  window.addEventListener('message', function (e) {
    if (e.origin !== FORM_ORIGIN) return
    var data = e.data
    if (!data || data.source !== 'cfgauss-embed-form') return

    if (typeof data.height === 'number' && isFinite(data.height) && data.height > 0) {
      if (gateIframe && e.source === gateIframe.contentWindow) gateIframe.style.height = data.height + 'px'
      else if (subscribeIframe && e.source === subscribeIframe.contentWindow) subscribeIframe.style.height = data.height + 'px'
      return
    }

    if (data.event === 'success' && gateIframe && e.source === gateIframe.contentWindow && pendingDest) {
      window.location.assign(pendingDest)
    }
  })

  var count = document.getElementById('dl-count')
  if (count) {
    fetch('/api/downloads')
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status) })
      .then(function (d) {
        if (typeof d.total === 'number') {
          count.textContent = d.total.toLocaleString('pt-BR')
        } else {
          throw new Error('sem total')
        }
      })
      .catch(function () { count.parentElement.hidden = true })
  }
})()
