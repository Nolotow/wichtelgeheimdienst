(() => {
  const EN={'secure.label':'SECURE INPUT','secure.submit':'TRANSMIT','secure.central':'Central Office','secure.error':'Input incorrect. Please try again!','laws.central':'TO CENTRAL OFFICE','laws.title':'Legislation and regulations','laws.lead':'Legal bases and general administrative provisions of the Weihnachtswichtelgeheimdienst.','laws.acts':'Acts','laws.regulations':'Statutory instruments','laws.admin':'Administrative provisions','laws.back':'← Back to the Central Office'};
  const originals=new WeakMap();
  function language(){return window.WWGI18N?.getLang?.()||'de'}
  function apply(){document.querySelectorAll('[data-i18n-extra]').forEach(el=>{if(!originals.has(el))originals.set(el,el.textContent);const key=el.dataset.i18nExtra;el.textContent=language()==='en'&&EN[key]!=null?EN[key]:originals.get(el)});if(location.pathname==='/sichere-kontaktaufnahme/')document.title=language()==='en'?'Secure contact · WWG':'Sichere Kontaktaufnahme';if(location.pathname==='/gesetze-und-normen/')document.title=language()==='en'?'Legislation and regulations · WWG':'Gesetze und Normen · WWG'}
  window.WWG_EXTRA_T=key=>language()==='en'&&EN[key]!=null?EN[key]:({'secure.error':'Eingabe inkorrekt. Bitte versuchen Sie es erneut!'}[key]||'');
  window.addEventListener('wwg-languagechange',apply);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
