# Apply Progress: Semántica del estado del trámite

**status:** complete
**rama:** `fix/estado-inicial-renombrado-15` → PR #37
**commits:** 7

> Todas las afirmaciones de este reporte se acompañan del comando que las midió. Lo que no se
> pudo medir se dice, en vez de darse por bueno.

## Orden de los hechos

La implementación **precedió** a la redacción de los artefactos de esta change. El trabajo se
exploró, se discutieron alternativas y se aprobó como plan antes de escribir código —ese plan
cumplió la función de proposal, design y tasks—, pero vivió fuera de `openspec/`. Los artefactos
lo formalizan a posteriori y **antes del merge**, para que la especificación gobierne lo que
entra a `main`. Queda registrado en lugar de simular una secuencia que no ocurrió.

## Commits

| Hash | Qué cierra |
|---|---|
| `3aee630` | Reconoce el estado inicial renombrado (parcial: rompía el otro trámite) |
| `65c9fc3` | Resuelve el inicio **por trámite**; corrige esa regresión |
| `d7d176e` | El módulo de semántica, sin consumidores todavía |
| `5a49bcc` | Conecta los predicados al modelo; ocho fixtures actualizados |
| `b09a5ff` | **#35**: los rechazos dejan de contarse como completados |
| `af02e75` | Migra «¿está cerrado?» y la firma de `isOverdue` |
| `26b7e3c` | Migra «¿está devuelto?» |

## Verificación

| Comando | Resultado |
|---|---|
| `pnpm test` | 153/153 en 20 archivos (126 en `main` al empezar) |
| `pnpm exec tsc --noEmit` | exit 0 |
| `pnpm lint` | exit 0 |
| `pnpm build` | exit 0 |

**Equivalencia del refactor.** `requests-table` y `app-shell` se migraron sin tener cobertura
previa, así que sus tests se escribieron después. Para que eso no quedara sin respaldo, se
revirtió el código con `git stash` —los archivos de test son untracked y sobreviven— y se
corrieron contra la versión anterior: **6 passed en ambas versiones**. Un test escrito mirando el
código nuevo puede pasar por estar moldeado a él; correrlo contra el viejo es lo que lo descarta.

## Hallazgos durante la implementación

1. **Una regresión propia, detectada antes de publicarla.** El arreglo inicial de #15 movía una
   constante global y rompía novedad de notas. Ningún test cubría ese trámite, que es por lo que
   no se vio al introducirla.
2. **Dos fixtures incoherentes que el modelo anterior ocultaba.** Tres declaraban el nombre viejo
   del estado inicial —desactualizados desde `V3.2.0`—, y uno declaraba una novedad de notas en
   un estado que ese trámite **no tiene**. Se corrigieron al poblar el estado crudo. Consecuencia:
   la maqueta ya no tiene ningún caso `'aprobado'`, porque el motor no produce ese valor para
   novedad de notas.
3. **Un candado del cliente que contradice al backend.** La pantalla del documento gatea por
   estado; `GET /requests/{id}/document` no gatea nada y el controlador documenta que el DO-FR-100
   se emite en cualquier momento de la vida de la solicitud. Se migró **preservando** el
   comportamiento, con la contradicción escrita en el código. Quitarlo es decisión de producto.
4. **Deuda de accesibilidad de paso:** el contador de urgentes del shell es un punto con un
   número, sin nombre accesible. Su test debe consultarlo por clase CSS porque no hay otra forma.

## Criterios de éxito

| Criterio | Estado |
|---|---|
| Ningún sitio decide leyendo `status` | ✅ verificado con `grep`; lo que queda es presentación |
| Un rechazo no figura entre las completadas | ✅ test de regresión |
| Una radicación reciente se reconoce en **ambos** trámites | ✅ test por trámite |
| El hueco de novedad de notas afirmado por un test | ✅ recorre sus seis estados |
| Los componentes tocados tienen cobertura | ✅ tres que no tenían ninguna |
