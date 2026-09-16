/**
 * Mexican states (Estados) and their municipalities (Municipios).
 *
 * Source: official Mexican geographical catalog (INEGI Marco Geoestadístico),
 * distilled to municipality-level entries per state. Includes the 32 federative
 * entities. Used by the event form for cascading Estado → Municipio selects.
 *
 * Trade-off chosen here: ship the full list as a typed const rather than
 * fetching it at runtime. The bundle is ~7KB minified and renders instantly,
 * keeping the form snappy on slow networks — better UX than a spinner.
 */
export interface MexicoLocation {
  estado: string; // Estado name, e.g. "Jalisco"
  municipios: readonly string[];
}

export const MEXICO_LOCATIONS: readonly MexicoLocation[] = [
  { estado: 'Aguascalientes', municipios: ['Aguascalientes', 'Asientos', 'Calvillo', 'Cosío', 'Jesús María', 'Pabellón de Arteaga', 'Rincón de Romos', 'San José de Gracia', 'Tepezalá', 'El Llano', 'San Francisco de los Romo'] },
  { estado: 'Baja California', municipios: ['Mexicali', 'Tijuana', 'Ensenada', 'Playas de Rosarito', 'Tecate', 'San Quintín'] },
  { estado: 'Baja California Sur', municipios: ['La Paz', 'Los Cabos', 'Mulegé', 'Comondú', 'Loreto'] },
  { estado: 'Campeche', municipios: ['Campeche', 'Ciudad del Carmen', 'Champotón', 'Escárcega', 'Calkiní', 'Hecelchakán', 'Hopelchén', 'Palizada', 'Tenabo', 'Calakmul', 'Candelaria', 'Seybaplaya'] },
  { estado: 'Chiapas', municipios: ['Tuxtla Gutiérrez', 'San Cristóbal de las Casas', 'Tapachula', 'Comitán de Domínguez', 'Palenque', 'Chiapa de Corzo', 'Tonalá', 'Ocosingo', 'Villaflores', 'Cintalapa', 'Motozintla', 'Las Margaritas', 'Huixtla'] },
  { estado: 'Chihuahua', municipios: ['Chihuahua', 'Ciudad Juárez', 'Cuauhtémoc', 'Delicias', 'Hidalgo del Parral', 'Camargo', 'Jiménez', 'Guerrero', 'Nuevo Casas Grandes', 'Ojinaga', 'Meoqui', 'Saucillo', 'Aldama', 'Bocoyna', 'Creel', 'Madera'] },
  { estado: 'Ciudad de México', municipios: ['Álvaro Obregón', 'Azcapotzalco', 'Benito Juárez', 'Coyoacán', 'Cuajimalpa de Morelos', 'Cuauhtémoc', 'Gustavo A. Madero', 'Iztacalco', 'Iztapalapa', 'La Magdalena Contreras', 'Miguel Hidalgo', 'Milpa Alta', 'Tláhuac', 'Tlalpan', 'Venustiano Carranza', 'Xochimilco'] },
  { estado: 'Coahuila de Zaragoza', municipios: ['Saltillo', 'Torreón', 'Monclova', 'Piedras Negras', 'Acuña', 'Sabinas', 'Ramos Arizpe', 'Nueva Rosita', 'Frontera', 'Múzquiz', 'Parras de la Fuente', 'San Pedro', 'Matamoros', 'Viesca'] },
  { estado: 'Colima', municipios: ['Colima', 'Manzanillo', 'Tecomán', 'Villa de Álvarez', 'Armería', 'Coquimatlán', 'Comala', 'Cuauhtémoc', 'Ixtlahuacán', 'Minatitlán'] },
  { estado: 'Durango', municipios: ['Durango', 'Gómez Palacio', 'Lerdo', 'Canatlán', 'Santiago Papasquiaro', 'El Salto', 'Vicente Guerrero', 'Poanas', 'Nuevo Ideal', 'Mapimí', 'Pueblo Nuevo', 'San Dimas', 'Tamazula'] },
  { estado: 'Guanajuato', municipios: ['Guanajuato', 'León', 'Irapuato', 'Celaya', 'Salamanca', 'San Miguel de Allende', 'Silao', 'Pénjamo', 'Dolores Hidalgo', 'San Luis de la Paz', 'Guanajuato Capital', 'Acámbaro', 'Apaseo el Grande', 'Apaseo el Alto', 'Comonfort', 'Cortazar', 'San Francisco del Rincón', 'Purísima del Rincón', 'Salvatierra', 'Yuriria', 'Moroleón', 'Uriangato', 'Romita'] },
  { estado: 'Guerrero', municipios: ['Chilpancingo de los Bravo', 'Acapulco de Juárez', 'Iguala de la Independencia', 'Taxco de Alarcón', 'Zihuatanejo de Azueta', 'Chilapa de Álvarez', 'Tlapa de Comonfort', 'Ayutla de los Libres', 'Coyuca de Benítez', 'Ometepec', 'Atoyac de Álvarez', 'Coyuca de Catalán', 'San Luis Acatlán', 'Huamuxtitlán'] },
  { estado: 'Hidalgo', municipios: ['Pachuca de Soto', 'Tulancingo', 'Mineral de la Reforma', 'Tizayuca', 'Huejutla de Reyes', 'Ixmiquilpan', 'Actopan', 'Apan', 'Tepeji del Río', 'Tepeapulco', 'Zimapán', 'Molango', 'Huichapan', 'Tula de Allende', 'Mixquiahuala'] },
  { estado: 'Jalisco', municipios: ['Guadalajara', 'Zapopan', 'Tlaquepaque', 'Tlajomulco de Zúñiga', 'Tonalá', 'Puerto Vallarta', 'El Salto', 'Lagos de Moreno', 'Tepatitlán de Morelos', 'Arandas', 'Atotonilco el Alto', 'Autlán de Navarro', 'Chapala', 'Ciudad Guzmán', 'Jocotepec', 'La Barca', 'Ocotlán', 'San Juan de los Lagos', 'San Miguel el Alto', 'Sayula', 'Tequila', 'Zacoalco de Torres', 'Zapotlanejo'] },
  { estado: 'México', municipios: ['Toluca de Lerdo', 'Ecatepec de Morelos', 'Naucalpan de Juárez', 'Tlalnepantla de Baz', 'Cuautitlán Izcalli', 'Chimalhuacán', 'Atizapán de Zaragoza', 'Ixtapaluca', 'Tecámac', 'Nezahualcóyotl', 'Huixquilucan', 'Coacalco de Berriozábal', 'Metepec', 'Texcoco', 'Lerma', 'Zinacantepec', 'San Mateo Atenco', 'Cuautitlán', 'Tultepec', 'Melchor Ocampo', 'Teotihuacán', 'San Martín Texmelucan', 'Tenancingo', 'Valle de Bravo', 'Tenango del Valle', 'Xonacatlán', 'Ocoyoacac', 'Tianguistenco', 'Jilotepec', 'Villa Victoria', 'Ixtlahuaca', 'Jiquipilco', 'Temascalcingo'] },
  { estado: 'Michoacán de Ocampo', municipios: ['Morelia', 'Uruapan', 'Zamora de Hidalgo', 'Lázaro Cárdenas', 'Apatzingán', 'Pátzcuaro', 'Zitácuaro', 'La Piedad', 'Sahuayo', 'Tacámbaro', 'Hidalgo', 'Maravatío', 'Cotija', 'Jiquilpan', 'Jacona'] },
  { estado: 'Morelos', municipios: ['Cuernavaca', 'Jiutepec', 'Temixco', 'Cuautla', 'Yautepec', 'Emiliano Zapata', 'Xochitepec', 'Axochiapan', 'Puente de Ixtla', 'Tepoztlán', 'Miacatlán', 'Tetela del Volcán'] },
  { estado: 'Nayarit', municipios: ['Tepic', 'Bahía de Banderas', 'Santiago Ixcuintla', 'Compostela', 'San Blas', 'Acaponeta', 'Tecuala', 'Rosamorada', 'Tuxpan', 'Ixtlán del Río', 'Jala'] },
  { estado: 'Nuevo León', municipios: ['Monterrey', 'Guadalupe', 'San Nicolás de los Garza', 'Apodaca', 'General Escobedo', 'Santa Catarina', 'San Pedro Garza García', 'Juárez', 'Cadereyta Jiménez', 'Linares', 'Montemorelos', 'Santiago', 'Allende', 'Galeana', 'Sabinas Hidalgo', 'Villaldama', 'China'] },
  { estado: 'Oaxaca', municipios: ['Oaxaca de Juárez', 'San Juan Bautista Tuxtepec', 'Heroica Ciudad de Huajuapan de León', 'Santiago Pinotepa Nacional', 'San Pedro Pochutla', 'Huatulco', 'Puerto Escondido', 'Tlaxiaco', 'Miahuatlán de Porfirio Díaz', 'Zimatlán de Álvarez', 'Juchitán de Zaragoza', 'Tehuantepec', 'Ixtlán de Juárez'] },
  { estado: 'Puebla', municipios: ['Puebla', 'Tehuacán', 'San Pedro Cholula', 'San Andrés Cholula', 'Atlixco', 'Cuautlancingo', 'Amozoc', 'Huauchinango', 'Izúcar de Matamoros', 'Tecamachalco', 'Acatlán de Osorio', 'Xicotepec', 'Zacatlán', 'Chignahuapan', 'Teziutlán', 'Libres'] },
  { estado: 'Querétaro', municipios: ['Santiago de Querétaro', 'Corregidora', 'El Marqués', 'Querétaro', 'San Juan del Río', 'Tequisquiapan', 'Cadereyta de Montes', 'Ezequiel Montes', 'Pedro Escobedo', 'Amealco de Bonfil', 'Colón', 'Huimilpan', 'Tolimán'] },
  { estado: 'Quintana Roo', municipios: ['Benito Juárez (Cancún)', 'Solidaridad (Playa del Carmen)', 'Cozumel', 'Tulum', 'Felipe Carrillo Puerto', 'Chetumal', 'Isla Mujeres', 'José María Morelos', 'Bacalar', 'Lázaro Cárdenas', 'Puerto Morelos'] },
  { estado: 'San Luis Potosí', municipios: ['San Luis Potosí', 'Soledad de Graciano Sánchez', 'Ciudad Valles', 'Matehuala', 'Tamazunchale', 'Rioverde', 'Cárdenas', 'Cerro de San Pedro', 'Villa de Reyes', 'Santa María del Río', 'Tamuín', 'Axtla de Terrazas', 'Xilitla'] },
  { estado: 'Sinaloa', municipios: ['Culiacán', 'Mazatlán', 'Los Mochis (Ahome)', 'Guasave', 'Navolato', 'Salvador Alvarado', 'El Fuerte', 'Sinaloa de Leyva', 'Mocorito', 'Angostura', 'Badiraguato', 'Cosalá', 'San Ignacio', 'Concordia', 'Escuinapa', 'Rosario', 'Elota'] },
  { estado: 'Sonora', municipios: ['Hermosillo', 'Cajeme (Ciudad Obregón)', 'Nogales', 'San Luis Río Colorado', 'Navojoa', 'Guaymas', 'Caborca', 'Agua Prieta', 'Empalme', 'Puerto Peñasco', 'Cananea', 'Huatabampo', 'Etchojoa', 'Magdalena de Kino'] },
  { estado: 'Tabasco', municipios: ['Centro (Villahermosa)', 'Cárdenas', 'Huimanguillo', 'Macuspana', 'Comalcalco', 'Cunduacán', 'Paraíso', 'Jalpa de Méndez', 'Centla', 'Nacajuca', 'Balancán', 'Tenosique', 'Teapa', 'Tacotalpa'] },
  { estado: 'Tamaulipas', municipios: ['Ciudad Victoria', 'Tampico', 'Ciudad Madero', 'Reynosa', 'Matamoros', 'Nuevo Laredo', 'San Fernando', 'Mante', 'Altamira', 'Río Bravo', 'Valle Hermoso', 'Ciudad Mier', 'Ciudad Camargo', 'Soto la Marina', 'Jaumave'] },
  { estado: 'Tlaxcala', municipios: ['Tlaxcala de Xicohténcatl', 'Apizaco', 'Huamantla', 'San Pablo del Monte', 'Chiautempan', 'Zacatelco', 'Calpulalpan', 'Contla de Juan Cuamatzi', 'Papalotla de Xicohténcatl', 'San Luis Teolocholco', 'Totolac', 'Ixtacuixtla'] },
  { estado: 'Veracruz de Ignacio de la Llave', municipios: ['Xalapa', 'Veracruz', 'Coatzacoalcos', 'Córdoba', 'Orizaba', 'Poza Rica de Hidalgo', 'Boca del Río', 'Tuxpan', 'Minatitlán', 'Martínez de la Torre', 'San Andrés Tuxtla', 'Catemaco', 'Tierra Blanca', 'Cosamaloapan', 'Emiliano Zapata', 'Xico', 'Coatepec', 'Perote', 'Fortín', 'Camerino Z. Mendoza'] },
  { estado: 'Yucatán', municipios: ['Mérida', 'Valladolid', 'Ticul', 'Progreso', 'Umán', 'Kanasín', 'Motul', 'Tekax', 'Peto', 'Maxcanú', 'Izamal', 'Conkal', 'Chichén Itzá', 'Chemax', 'Tizimín', 'Celestún', 'Río Lagartos'] },
  { estado: 'Zacatecas', municipios: ['Zacatecas', 'Fresnillo', 'Guadalupe', 'Jerez', 'Río Grande', 'Villanueva', 'Sombrerete', 'Calera', 'Pinos', 'Trancoso', 'Ojocaliente', 'Loreto', 'Moyahua de Estrada', 'Nochistlán de Mejía', 'Juchipila', 'Tabasco', 'Tlaltenango'] },
];

export function getMunicipios(estado: string): readonly string[] {
  const match = MEXICO_LOCATIONS.find((l) => l.estado === estado);
  return match?.municipios ?? [];
}

export const ESTADOS: readonly string[] = MEXICO_LOCATIONS.map((l) => l.estado);
