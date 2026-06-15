
/**
 * Lista blanca de usuarios que pueden cambiar rápidamente
 * a otros jugadores sin pedir código.
 *
 * IMPORTANTE:
 * Lo ideal es usar IDs de jugador estables.
 * Si aún no los tienes controlados, puedes empezar por nombre.
 */

export const PLAYER_DELEGATIONS_BY_NAME = {
  'Amanda Gamboa': ['Amanda Gamboa', 'Nestor Gamboa', 'Aura C'],
  'Karen Navarro': ['Karen Navarro', 'Dinara Gamboa', 'Heidy Gamboa', 'Julio Padilla', 'Leonardo Padilla', 'Valentina Acero', 'Juan Rosero', 'Julian Gutierrez', 'Mateo Gamboa', 'Carolina Pinilla', 'Santiago Galeano', 'Emiliee'],
  'Nicolas Gamboa': ['Nicolas Gamboa', 'Tochi', 'Sonia Rodriguez'],
  'Sonia Rodriguez': ['Sonia Rodriguez', 'Alejandro Gamboa', 'Luciana Gamboa'],
  'Nestor Gamboa': ['Nestor Gamboa', 'Heidy Gamboa'],
  'Leonardo Padilla': ['Leonardo Padilla', 'Bianca Padilla', 'Sebastian Borda', 'Leonardo Baez', 'Patricia Candamil', 'Luciana Gamboa', 'Alejandro Gamboa', 'Sandra Moreno', 'Diana Serrano' ],
  'Valentina Acero': ['Valentina Acero', 'Linda Patarroyo', 'Sandra Acero']

};

/**
 * Si más adelante prefieres trabajar por IDs de Firebase,
 * puedes usar esta otra estructura:
 *
 * export const PLAYER_DELEGATIONS_BY_ID = {
 *   'playerIdAmanda': ['playerIdAmanda', 'playerIdNestor', 'playerIdAura'],
 * };
 */
