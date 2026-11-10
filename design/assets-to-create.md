# Pandora — lista de modelos y animaciones

Este documento prepara la producción 3D sin modificar el GDD. Los sistemas del juego deben funcionar primero con el escenario y las piezas provisionales; cada GLB final sustituirá una pieza por su ID. Los modelos que se repiten se exportan una vez y se instancian en varias posiciones.

## Reglas de entrega

- El escenario principal es un GLB independiente y no contiene objetos que el jugador deba pulsar. Se conserva `assets/scene/20261010_Pandora.glb` como base mientras se construye el mundo.
- Cada tipo de objeto interactivo se entrega como GLB separado. Un nodo de madera se modela una vez; el juego lo coloca en los distintos puntos de recolección.
- Un modelo puede contener varias mallas visuales, pero su punto de origen debe quedar centrado en el suelo y su frente orientado hacia `+Z`. Evitar escalas y rotaciones aplicadas de forma arbitraria; el juego colocará, escalará y orientará cada instancia.
- Mantener nombres descriptivos, texturas incluidas en el GLB y una pose neutral clara. Las animaciones se entregan aparte, con el mismo nombre base del modelo y clips nombrados.
- No incluir indicadores de UI ni textos dentro de los modelos. El juego añade interacción, alcance, estado agotado, salud del enemigo y recompensas.
- Los modelos que reciben interacción tendrán un collider sencillo que añadiremos desde el código; no hace falta modelar un collider complejo dentro de la geometría visual.
- Exporta a escala métrica (1 unidad del archivo = 1 metro), con transformaciones aplicadas, pivote en el punto indicado abajo y sin objetos de colisión separados. El juego ajustará la escala visual y añadirá los colliders sencillos por código.
- Los recursos, enemigos y cofres se entregan **una vez por tipo**, nunca uno por posición. El juego instancia el mismo GLB en todos los nodos definidos; cada nodo conserva su ID, contador y enfriamiento compartidos aunque use el mismo modelo visual.
- Las animaciones se entregan en archivos separados por modelo, con el mismo esqueleto/jerarquía y nombres de clip de esta lista. Como el Animator de Decentraland lee los clips asociados al GLB de la entidad, al integrarlos los incorporaremos al GLB runtime del modelo manteniendo tu export de animaciones separado como fuente.

## Prioridad A — objetos necesarios para jugar

| ID sugerido | Archivo GLB | Uso | Reutilización |
|---|---|---|---|
| `resource_wood` | `resource_wood.glb` | Rama o madera caída recogible | Instancias múltiples en el bosque |
| `resource_stone` | `resource_stone.glb` | Roca recogible | Instancias múltiples en bosque y cuevas |
| `resource_fruit` | `resource_fruit.glb` | Arbusto de frutos silvestres | Instancias múltiples en el bosque |
| `resource_iron` | `resource_iron.glb` | Veta de hierro | Instancias múltiples en las cuevas |
| `resource_medicinal_plants` | `resource_medicinal_plants.glb` | Plantas medicinales | Instancias múltiples en las cuevas |
| `resource_ancestral_ore` | `resource_ancestral_ore.glb` | Mineral ancestral de las ruinas | Instancias múltiples en las ruinas |
| `enemy_root_prowler` | `enemy_root_prowler.glb` | Enemigo normal del bosque | Varias instancias; cada una conserva su vida y respawn compartidos |
| `enemy_stoneback` | `enemy_stoneback.glb` | Enemigo acorazado de las cuevas | Varias instancias |
| `enemy_cave_warden` | `enemy_cave_warden.glb` | Guardián de las cuevas | Instancias de encuentro |
| `enemy_ruin_sentinel` | `enemy_ruin_sentinel.glb` | Enemigo mágico de las ruinas | Varias instancias |
| `enemy_colossal_guardian` | `enemy_colossal_guardian.glb` | Jefe comunitario de las ruinas | Una instancia activa |
| `chest_common` | `chest_common.glb` | Cofre común; recompensa y suministros personales | Varios cofres independientes |
| `chest_rare` | `chest_rare.glb` | Cofre raro | Varios cofres independientes |
| `chest_ancient` | `chest_ancient.glb` | Cofre antiguo/ancestral | Varios cofres independientes |
| `companion_robot` | `companion_robot.glb` | Robot flotante que ejecuta las habilidades | Una instancia por jugador; no es un objeto clicable |

**Cantidad de instancias prevista por el catálogo inicial:** 8 Root Prowlers; 5 Stonebacks; 2 Cave Wardens; 5 Ruin Sentinels; 1 Colossal Guardian; 8 nodos de madera, 6 de piedra y 6 de fruto; 6 vetas de hierro y 5 grupos de plantas medicinales; 4 depósitos de mineral ancestral; 6 cofres comunes, 4 raros y 3 antiguos simultáneamente activos. Esos son puntos/nodos del juego, no archivos GLB adicionales.

## Prioridad B — pueblo, servicios y viaje

| ID sugerido | Archivo GLB | Uso | Cuándo aparece |
|---|---|---|---|
| `village_great_tree` | `village_great_tree.glb` | Árbol bioluminiscente y referencia central | Nivel 1; puede estar ya dentro del escenario base |
| `service_delivery_station` | `service_delivery_station.glb` | Entregar todos los recursos y suministros transportados | Nivel 1 |
| `service_shop_stall` | `service_shop_stall.glb` | Abrir la tienda de monedas | Nivel 1 |
| `service_skill_board` | `service_skill_board.glb` | Abrir el tablero personal | Nivel 1 |
| `building_storehouse` | `building_storehouse.glb` | Ver reservas compartidas y necesidades pendientes | Nivel 2 |
| `building_communal_shelter` | `building_communal_shelter.glb` | Restaurar aura fuera de combate | Nivel 3 |
| `building_infirmary` | `building_infirmary.glb` | Restaurar toda la salud | Nivel 5 |
| `building_training_ground` | `building_training_ground.glb` | Zona de práctica sin recompensas ni crédito de combate | Nivel 6 |
| `training_dummy` | `training_dummy.glb` | Blanco indestructible para ataques y habilidades | Nivel 6; varias instancias |
| `building_observatory` | `building_observatory.glb` | Consultar destinos visitados y avisos generales de islas | Nivel 9 |
| `building_communal_monument` | `building_communal_monument.glb` | Monumento y celebración del ciclo | Nivel 10 |
| `travel_waypoint` | `travel_waypoint.glb` | Punto visitable para Phase Jump | Uno por isla; se activa en la isla correspondiente |

Los niveles 4, 7, 8, 11 y 12 son ampliaciones visuales del pueblo, no edificios con mecánicas nuevas. Se pueden producir como piezas intercambiables por fase (`village_upgrade_forest`, `village_upgrade_settled`, `village_upgrade_established`, `village_upgrade_monument`, `village_upgrade_final`) o incluirlas en el GLB base como zonas que activaremos progresivamente. No hace falta modelar trece pueblos completos.

## Prioridad C — fauna ambiental

| Archivo GLB | Uso | Reglas |
|---|---|---|
| `wildlife_bird.glb` | Aves ambientales | No atacables ni cazables |
| `wildlife_deer.glb` | Ciervos ambientales | No atacables ni cazables |

## Animaciones que preparar

- **Robot acompañante:** `hover_idle`, `follow`, `basic_shot`, `boost`, `ascension`, `phase_jump`, `impact_pulse`, `kinetic_shield`, `precision_shot`, `arcane_bolt`, `healing_pulse`, `link_field`. Efectos Explorer verde, Warrior rojo, Mage azul y servicios neutrales amarillo. Un clip de ataque/skill breve (0.5–1.5 s); estados `hover_idle`/`follow` en bucle.
- **Root Prowler (8 instancias):** `idle`, `move`, `telegraph`, `attack`, `hit`, `defeat`, `respawn`; aviso normal legible durante 0.9 s.
- **Stoneback (5):** mismos clips; `telegraph` previo a su embestida durante 0.9 s.
- **Cave Warden (2):** mismos clips más ataques `frontal_strike` y `area_pulse`; aviso de área de 1.2 s.
- **Ruin Sentinel (5):** mismos clips y disparo `magic_projectile`; aviso de 0.9 s.
- **Colossal Guardian (1):** mismos clips más `stomp` y `sweep`; aviso de área de 1.5 s.
- **Cada recurso (6 tipos):** `depleted`/recolección y `respawn`; `idle` es opcional. Si no entregas estos clips, el código oculta el nodo agotado y lo vuelve a mostrar tras 30 s (madera/piedra/fruto), 60 s (hierro/plantas) o 120 s (mineral ancestral).
- **Cada cofre (3 tipos):** `closed`, `open`; `respawn` opcional. El código gestiona su desaparición compartida y tiempo de regreso: 2/5/10 min para común/raro/antiguo.
- **Fauna:** aves `perch_idle`, `takeoff`, `fly`, `land`; ciervos `idle`, `walk`, `run`.
- **Pueblo:** `growth_appear` para las piezas de ampliación y un pulso de luz del árbol central. La animación debe ser breve y reproducible al entrar en el nuevo nivel.

## Reservado para una expansión

No producir como requisito de lanzamiento: cristales físicos coleccionables, grimorios de un uso, cosméticos, nuevos enemigos, nuevas runas con habilidades fuera del catálogo inicial ni construcciones posteriores al ciclo definido.

## Orden recomendado de entrega

1. Mantener el escenario base actual y entregar seis modelos de recursos, Root Prowler y cofre común para sustituir las piezas de prueba del bosque.
2. Entregar el robot y sus clips separados compatibles con su esqueleto.
3. Entregar Stoneback, Cave Warden y cofre raro; después Ruin Sentinel, Colossal Guardian y cofre antiguo/relicario.
4. Entregar los edificios de servicio y las ampliaciones del pueblo según se activen sus mecánicas.
5. Añadir fauna y animaciones ambientales al final.
