/* eslint-disable no-unused-vars, no-undef */
/**
 * popup_form.js – autonomic‑symptom edition (FULL FILE, ESLint‑clean)
 * -------------------------------------------------------------
 * Builds the dialog with 33 autonomic symptom check‑boxes and a
 * free‑text row.  Generic save / load loops persist any check‑box
 * whose name matches a key in the SYMPTOMS palette.
 */

import { syncTwins }                    from './twins.js';
import { copy_dataset, getNodeByName }  from './utils.js';
import { current as pedcache_current }  from './pedcache.js';

// ------------------------------------------------------------------
// SYMPTOMS palette (type → colour) – identical to opts.diseases
const SYMPTOMS = [
  {type:'hyperhidrosis',        colour:'#c23531'},
  {type:'ibs',                  colour:'#f39c12'},
  {type:'dizziness',            colour:'#8e44ad'},
  {type:'brain_fog',            colour:'#2980b9'},
  {type:'fatigue',              colour:'#27ae60'},
  {type:'anxiety',              colour:'#d35400'},
  {type:'poor_sleep',           colour:'#2c3e50'},
  {type:'high_pain_tolerance',  colour:'#7f8c8d'},
  {type:'bladder_problems',     colour:'#16a085'},
  {type:'joint_hypermobility',  colour:'#e67e22'},
  {type:'ehlers_danlos',        colour:'#9b59b6'},
  {type:'shaking',              colour:'#34495e'},
  {type:'impaired_vision',      colour:'#1abc9c'},
  {type:'sob',                  colour:'#e74c3c'},
  {type:'fainting',             colour:'#95a5a6'},
  {type:'palpitations',         colour:'#c0392b'},
  {type:'itching',              colour:'#d35400'},
  {type:'headache',             colour:'#8e44ad'},
  {type:'kidney_disease',       colour:'#27ae60'},
  {type:'depression',           colour:'#2c3e50'},
  {type:'raynaud',              colour:'#2980b9'},
  {type:'rashes',               colour:'#c23531'},
  {type:'celiac',               colour:'#f39c12'},
  {type:'sjogren',              colour:'#8e44ad'},
  {type:'thoracic_outlet',      colour:'#16a085'},
  {type:'pelvic_compression',   colour:'#d35400'},
  {type:'thyroid',              colour:'#e67e22'},
  {type:'pcos',                 colour:'#9b59b6'},
  {type:'anhidrosis',           colour:'#34495e'},
  {type:'small_fiber_neurop',   colour:'#1abc9c'},
  {type:'chiari',               colour:'#e74c3c'},
  {type:'restless_leg',         colour:'#95a5a6'},
  {type:'tingling',             colour:'#c0392b'}
];

// ------------------------------------------------------------------
$(document).on('fhChange', function (_e, opts) {
  try {
    const id   = $('#id_name').val();
    const node = getNodeByName(pedcache_current(opts), id);
    $('form > fieldset').prop('disabled', node === undefined);
  } catch (err) { console.warn(err); }
});

export function updateStatus (status) {
  $('#age_yob_lock').removeClass('fa-lock fa-unlock-alt');
  (status === '1' ? $('#age_yob_lock').addClass('fa-unlock-alt')
                  : $('#age_yob_lock').addClass('fa-lock'));
  $('#id_age_' + status).removeClass('hidden');
  $('#id_age_' + (status === '1' ? '0' : '1')).addClass('hidden');
}

// =================================================================
// MAIN CLICK HANDLER
// =================================================================
export function nodeclick (node) {
  $('form > fieldset').prop('disabled', false);

  // -----------------------------------------------------------
  // build symptom panel (once)
  if ($('#cancer').length === 0) {
    const $c = $('<div id="cancer"></div>').appendTo('#person_details');

    SYMPTOMS.forEach(d => {
      $c.append(
        '<div class="row">' +
        '  <span style="display:inline-block;width:6px;background:' + d.colour + '"></span>' +
        '  <span>' + d.type.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) + '</span>' +
        '  <input type="checkbox" name="' + d.type + '">' +
        '</div>');
    });

    // "Other / specify" controls (text + colour picker)
    $c.append(`
      <div class="row">
        <span>Other / specify</span>
        <input id="id_other_symptom"
               name="other_symptom"
               type="text"
               placeholder="symptom"
               style="width:150px;margin-left:6px">

        <input id="id_other_colour"
               name="other_colour"
               type="color"
               value="#cccccc"
               style="width:40px;border:0;padding:0;margin:0 6px">

        <button id="btn_add_symptom" type="button">Add</button>
      </div>`);

    // One‑off click handler – refreshes on every dialog rebuild
    $(document)
      .off('click.otherSymptom')
      .on('click.otherSymptom', '#btn_add_symptom', function () {

        const txt = $('#id_other_symptom').val()
                                          .trim()
                                          .replace(/\s+/g, '_')
                                          .toLowerCase();
        const col = $('#id_other_colour').val();

        if (!txt)                  { alert('Please enter a label');  return; }
        if (SYMPTOMS.some(d => d.type   === txt)) { alert('Already listed'); return; }
        if (SYMPTOMS.some(d => d.colour.toLowerCase() === col.toLowerCase())) {
             alert('Colour already used'); return;
        }

        const obj = { type: txt, colour: col };
        SYMPTOMS.push(obj);          // mutating the const is fine
        opts.diseases.push(obj);     // keeps drawing layer in sync

        /* add a new checkbox row */
        $('#cancer').find('#btn_add_symptom')
          .closest('.row')
          .before(
            `<div class="row">
               <span style="display:inline-block;width:6px;background:${col}"></span>
               <span>${txt.replace(/_/g,' ')
                           .replace(/\\b\\w/g,c=>c.toUpperCase())}</span>
               <input type="checkbox" name="${txt}">
             </div>`);

        /* tidy up */
        $('#id_other_symptom').val('');
        $('#id_other_colour').val('#cccccc');
    });
  }

  // -----------------------------------------------------------
  // clear current values
  $('#person_details').find('input[type=text], input[type=number]').val('');
  $('#person_details select').val('').prop('selected', true);

  // ---- basic radios and status
  if (node.sex === 'M' || node.sex === 'F')
    $('input[name=sex][value="' + node.sex + '"]').prop('checked', true);
  else
    $('input[name=sex]').prop('checked', false);

  if (!('status' in node)) node.status = 0;
  $('input[name=status][value="' + node.status + '"]').prop('checked', true);
  updateStatus(node.status);

  $('#id_proband').prop('checked', !!node.proband)
                  .prop('disabled', 'proband' in node);
  $('#id_exclude').prop('checked', !!node.exclude);
  $('#id_yob_0').val('yob' in node ? node.yob : '-');

  // ---- load check‑boxes
  $('#person_details input[type="checkbox"]').each(function () {
    this.checked = !!node[this.name];
  });

  // ---- load simple fields
  for (const key in node) {
    if (key === 'proband' || key === 'sex') continue;
    if ($('#id_' + key).length) $('#id_' + key).val(node[key]);
  }

  try {
    $('#person_details').find('form').valid();
  } catch (_) {
    /* If jQuery‑Validation isn’t loaded we can safely ignore the error. */
  }
}

// ------------------------------------------------------------------
function update_ashkn () { return; }                 // stub
export function save_ashkn (_opts) { return; }       // stub with param

// =================================================================
// SAVE ROUTINE – generic check‑boxes
// =================================================================
export function save (opts) {
  const nds  = copy_dataset(pedcache_current(opts));
  const p    = getNodeByName(nds, $('#id_name').val());
  if (!p) return;

  // check‑boxes
  $('#person_details input[type="checkbox"]').each(function () {
    this.checked ? p[this.name] = true : delete p[this.name];
  });

  // text/number fields
  $('#person_details input[type=text]:visible, #person_details input[type=number]:visible').each(function () {
    $(this).val() ? p[this.name] = $(this).val() : delete p[this.name];
  });

  syncTwins(nds, p);
  opts.dataset = nds;
  $(document).trigger('rebuild', [opts]);
}

export function update_diagnosis_age_widget () { return; }
function update_cancer_by_sex () { /* noop */ }
function round5 (x) { const y=Math.round((x-1)/10)*10; return x<y?y-5:y+5; }
// --- end ---
