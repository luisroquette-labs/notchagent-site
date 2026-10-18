/* Gate de lead: nenhum download/App Store abre sem antes passar pelo
   formulário do motor de forms da CF Gauss. Os botões [data-gate] abrem um
   modal com o form embarcado; no sucesso (postMessage cfgauss-embed-form)
   navegamos pro destino em data-dest. */
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

  /* Contrato do motor de forms da CF Gauss: mensagens {source:"cfgauss-embed-form"}.
     Altura → ajusta o iframe; event:"success" → lead capturado.
     Distingue o iframe do gate do iframe inline por e.source (mesmo formId). */
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
      /* Lead gravado pelo servidor; navegar o próprio tab não é bloqueável
         pelo popup-blocker (ao contrário de window.open assíncrono). */
      window.location.assign(pendingDest)
    }
    /* Sucesso no iframe inline (#subscribe) não navega — o próprio form
       mostra o estado de "pronto" dentro do iframe. */
  })

  /* Contador real de downloads via GitHub API — nunca um número inventado. */
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
