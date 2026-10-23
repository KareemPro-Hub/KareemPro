// A local, deterministic guide using the same catalog as the displayed prices.
export function mountPackageFinder() {
  const buttons = [...document.querySelectorAll('[data-package-finder]')];
  const source = document.getElementById('package-finder-catalog');
  if (!buttons.length || !source) return;
  let catalog;
  try { catalog = JSON.parse(source.textContent); } catch { return; }
  const dialog = document.createElement('dialog');
  dialog.className = 'pf-dialog'; dialog.dir = 'rtl'; dialog.setAttribute('aria-labelledby', 'pf-title');
  dialog.innerHTML = '<div class="pf-top"><span>اختيار أوضح. انطلاقة أقوى.</span><button type="button" class="pf-close">إغلاق</button></div><p class="pf-step" aria-live="polite"></p><h2 id="pf-title" tabindex="-1"></h2><div class="pf-content"></div><div class="pf-nav"><button type="button" class="pf-back">رجوع</button><button type="button" class="pf-next">التالي</button></div>';
  document.body.append(dialog);
  const title = dialog.querySelector('h2'), content = dialog.querySelector('.pf-content'), progress = dialog.querySelector('.pf-step');
  const back = dialog.querySelector('.pf-back'), next = dialog.querySelector('.pf-next');
  let state, opener, oldOverflow;
  function element(tag, text, cls) { const el = document.createElement(tag); if (text) el.textContent = text; if (cls) el.className = cls; return el; }
  function service() { return catalog.find(s => s.id === state.service); }
  function pack() { return service().packages[state.choice]; }
  function options(items, value, onSelect) {
    const group = element('div', '', 'pf-options');
    for (const item of items) {
      const label = element('label', '', 'pf-option'), input = document.createElement('input');
      input.type = 'radio'; input.name = 'pf-choice'; input.value = item.value; input.checked = item.value === value;
      input.addEventListener('change', () => { onSelect(item.value); next.disabled = false; });
      const text = element('span'); text.append(element('strong', item.label));
      if (item.hint) text.append(element('small', item.hint));
      label.append(input, text); group.append(label);
    }
    content.append(group);
  }
  function whatsapp(pkg, underBudget) {
    let message = `السلام عليكم، أريد استشارة بخصوص ${service().name} — ${pkg.name.split('|')[0]} بسعر ${pkg.price.toLocaleString('en-US')} ريال سعودي.`;
    if (state.budget) message += ` ميزانيتي التقريبية ${state.budget} ريال سعودي.`;
    if (underBudget) message += ' أحتاج تحديد نطاق يناسب الميزانية.';
    return 'https://wa.me/966507069605?text=' + encodeURIComponent(message);
  }
  function render() {
    content.replaceChildren(); back.hidden = state.step === 0; next.hidden = false; next.disabled = false;
    progress.textContent = state.step < 3 ? `الخطوة ${state.step + 1} من 3` : 'ترشيح مناسب لاختياراتك';
    next.textContent = state.step === 2 ? 'اعرض الباقة الأنسب لي' : 'التالي';
    if (state.step === 0) {
      title.textContent = 'ما المشروع الذي تريد إطلاقه ؟';
      const choices = catalog.filter(s => ['platforms','edu','store','blog'].includes(s.id) || s.id === state.initial);
      options(choices.map(s => ({value:s.id,label:s.name})), state.service, id => { if(state.service !== id) {state.choice = null; state.budget = null;} state.service=id; });
      next.disabled = !state.service;
    } else if (state.step === 1) {
      const blog = state.service === 'blog'; title.textContent = blog ? 'كم مقالًا تحتاج لمدونتك ؟' : 'هل تحتاج تطبيقات لمشروعك ؟';
      const choices = blog ? [
        {label:'تجهيز المدونة مع 3 مقالات هدية',hint:'انطلاقة بهوية احترافية.'},
        {label:'مدونة مع 10 مقالات إجمالًا',hint:'تجهيز ومحتوى لبداية أقوى.'},
        {label:'مدونة مع 60 مقالًا إجمالًا',hint:'محتوى أوسع يدعم انتشارك.'}
      ] : [
        {label:'موقع احترافي بدون تطبيقات',hint:'تجربة متجاوبة للجوال والكمبيوتر.'},
        {label:'موقع وتطبيقات مرتبطة به',hint:'تطبيقات WebView لآيفون وأندرويد.'},
        {label:'موقع وتطبيقات بتجربة خاصة',hint:'تطبيقات Native لآيفون وأندرويد.'}
      ];
      options(choices.map((c,i)=>({...c,value:String(i)})), state.choice == null ? null : String(state.choice), value => {state.choice=Number(value);});
      next.disabled = state.choice == null;
    } else if (state.step === 2) {
      title.textContent = 'ما ميزانيتك التقريبية ؟';
      const label = element('label', 'بالريال السعودي', 'pf-budget-label'); label.htmlFor = 'pf-budget';
      const input = document.createElement('input'); input.id = 'pf-budget'; input.type = 'number'; input.min = '1'; input.max = '10000000'; input.step = '1'; input.inputMode = 'numeric'; input.placeholder = 'اكتب ميزانيتك التقريبية'; input.value = state.budget || ''; input.className = 'pf-budget';
      const error = element('p', '', 'pf-error'); error.setAttribute('role','alert');
      input.addEventListener('input', () => { state.budget = input.value; error.textContent = ''; });
      const skip = element('button', 'لم أحدد الميزانية بعد', 'pf-skip'); skip.type = 'button'; skip.addEventListener('click',()=>{state.budget=null;state.step=3;render();});
      content.append(label,input,error,element('p','بنرشّح حسب احتياجك، ومن غير أي التزام.','pf-hint'),skip);
    } else {
      next.hidden = true; const pkg = pack(); const low = state.budget && Number(state.budget) < pkg.price;
      title.textContent = low ? 'خلّينا نضبط نطاق مشروعك.' : 'الباقة الأنسب لانطلاقة مشروعك.';
      content.append(element('p',service().name,'pf-service'),element('h3',pkg.name.split('|')[0]));
      const price = element('p','', 'pf-price'); price.append(element('bdi',pkg.price.toLocaleString('en-US')));
      const symbol = element('span','','riyal-symbol'); symbol.setAttribute('role','img');symbol.setAttribute('aria-label','ريال سعودي');price.append(symbol);content.append(price);
      content.append(element('p',pkg.name.split('|')[1],'pf-reason'));
      content.append(element('p',`المدة التقديرية: ${pkg.deliveryLabel}.`,'pf-hint'));
      if(low) content.append(element('p','الباقة المناسبة لاحتياجك أعلى من ميزانيتك الحالية. نقدر نتناقش في نطاق أبسط يناسبك.','pf-budget-note'));
      const actions=element('div','','pf-actions');
      const primary=element('a',low?'ناقش نطاقًا يناسب ميزانيتك':'ابدأ مشروعك بهذه الباقة','pf-primary'); primary.href=low?whatsapp(pkg,true):`/checkout?service=${state.service}&tier=${pkg.id}`;
      const secondary=element('a',low?'اطّلع على الباقة':'استفسر قبل البداية','pf-secondary'); const matchingTab=document.querySelector(`#price-tab-${state.service}`);secondary.href=low?(matchingTab?'#pricing':service().url+'#pricing'):whatsapp(pkg,false);
      if(low) secondary.addEventListener('click',()=>{document.querySelector(`#price-tab-${state.service}`)?.click();dialog.close();});
      actions.append(primary,secondary);content.append(actions,element('p','المدة تبدأ بعد استلام البيانات والمقدّم. مراجعة متاجر التطبيقات لها مدة منفصلة.','pf-hint'));
    }
    title.focus();
  }
  next.addEventListener('click',()=>{
    if(state.step===2){const input=content.querySelector('input');if(!input.value || !input.checkValidity()){content.querySelector('.pf-error').textContent='اكتب ميزانية صحيحة، أو اختر «لم أحدد الميزانية بعد».';input.focus();return;}state.budget=Number(input.value);}
    state.step++;render();
  });
  back.addEventListener('click',()=>{state.step--;render();});
  dialog.querySelector('.pf-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  dialog.addEventListener('close',()=>{document.body.style.overflow=oldOverflow;opener?.focus();});
  for(const button of buttons) button.addEventListener('click',()=>{
    opener=button;state={step:0,service:button.dataset.packageFinder||null,initial:button.dataset.packageFinder||null,choice:null,budget:null};oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.showModal();render();
  });
}
