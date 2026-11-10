# Pandora — referencias 3D de enemigos

Cada imagen es una referencia visual individual para Meshy o Blender. Se han compuesto para facilitar la reconstrucción y el rigging; no son modelos finales ni mapas de rig.

## Referencias

| ID del modelo | Tipo de pose | Imagen |
|---|---|---|
| `enemy_root_prowler` | Cuadrúpeda neutral; cuatro patas visibles y cola separada | [enemy_root_prowler.png](enemy_root_prowler.png) |
| `enemy_stoneback` | Cuadrúpeda neutral; placas grandes que dejan libres las articulaciones | [enemy_stoneback.png](enemy_stoneback.png) |
| `enemy_cave_warden` | Bípeda neutral, brazos apartados del torso | [enemy_cave_warden.png](enemy_cave_warden.png) |
| `enemy_ruin_sentinel` | Bípeda en A-pose, segmentos mecánicos articulables | [enemy_ruin_sentinel.png](enemy_ruin_sentinel.png) |
| `enemy_colossal_guardian` | Bípeda en A-pose, armadura separada de las articulaciones | [enemy_colossal_guardian.png](enemy_colossal_guardian.png) |

## Guía de modelado y rigging

- Mantener el cuerpo entero dentro del encuadre y la silueta legible. Las dos criaturas cuadrúpedas necesitan cuatro patas, hombros/caderas, codos/rodillas y cola distinguibles; los bípedos deben conservar hombros, codos, muñecas, caderas, rodillas y tobillos claros.
- No cubrir ni fusionar visualmente las articulaciones con placas, follaje, espinas o adornos. Dejar espacio para flexionar extremidades y cola.
- Crear un mesh y esqueleto adecuados para la familia de movimiento: cuadrúpedo para Root Prowler y Stoneback; bípedo para Warden, Sentinel y Guardian. Las instancias de cada familia reutilizarán el mismo modelo.
- Aplicar escala métrica (1 unidad = 1 metro), transformaciones y pose neutral. Colocar el origen en el centro entre los pies sobre el suelo y orientar el frente hacia `+Z`.
- Exportar cada enemigo como GLB separado. Preparar aparte los clips descritos en `design/assets-to-create.md` usando el mismo esqueleto que el GLB.

Las imágenes son referencias conceptuales: Meshy puede cambiar detalles y proporciones. Antes de exportar, revisar las patas ocultas, la topología alrededor de articulaciones y la compatibilidad del esqueleto con las animaciones.
