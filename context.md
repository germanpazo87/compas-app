# Compàs — Context del Projecte

## Què és Compàs
Aplicació web adaptativa per a l'ensenyament de matemàtiques a alumnat GES 
(Graduat en Educació Secundària, majors de 16 anys amb baix rendiment i 
barrera lingüística). L'activació cognitiva prèvia és prerequisit per accedir 
al suport del LLM.

## Estat actual (diagnòstic fet)
- L'arquitectura és sòlida, no cal reconstruir res
- Hi ha 3 bugs crítics documentats a /docs/fixes/
- Els mòduls de geometria (Pitàgores i Tales) no existeixen

## Els 3 bugs a resoldre (en ordre)
1. fix-01: competenceId hardcoded a 'calculation_specific' a ExerciseContainer.tsx:264
2. fix-03: evocació amb concepte hardcoded a ExerciseContainer.tsx:218
3. fix-02: Oracle rep només 3 camps del model d'alumne, cal injectar mastery complet

## Objectiu immediat
Tenir el sistema funcionant correctament sobre estadística (que ja existeix) 
per demostrar al director dijous. Pitàgores i Tales es construiran després.

## Nomenclatura
- El sidebar LLM s'anomena Oracle (nom original) o CompasService/CompasContext
- El nom del projecte és Compàs (no La Matriu, que era el nom anterior)
- El LLM integrat és Gemini

## Restricció pedagògica clau
El LLM mai dona la resposta final. Sempre pistes progressives.
```

---
