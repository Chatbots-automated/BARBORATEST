import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format, differenceInDays, eachDayOfInterval, parseISO, isSameDay, subDays } from 'date-fns';
import { lt } from 'date-fns/locale';
import { Calendar, Tag, X, Check, Loader2, AlertCircle, Users, Phone, Globe, Info } from 'lucide-react';
import { Apartment, BookingDetails, Coupon } from '../types';
import { supabase } from '../lib/supabase';

interface BookingFormProps {
  apartment: Apartment;
  onClose: () => void;
}

export function BookingForm({ apartment, onClose }: BookingFormProps) {
  const [step, setStep] = useState(1);
  const [bookingDetails, setBookingDetails] = useState<Partial<BookingDetails>>({
    apartmentId: apartment.id,
    numberOfGuests: 2,
    hasPets: false,
    extraBed: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookedDates, setBookedDates] = useState<Date[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const getApartmentBaseName = (fullName: string): string => {
    const nameMap: { [key: string]: string } = {
      'Senovinis medinis namas "Gintaras"': 'gintaras',
      'Dvivietis apartamentas "Pikulas"': 'pikulas',
      'Šeimyninis apartamentas "Māra"': 'mara',
      'Namelis dviems "Medeinė"': 'medeine'
    };
    return nameMap[fullName] || fullName.toLowerCase();
  };

  useEffect(() => {
    async function fetchBookedDates() {
      try {
        const baseName = getApartmentBaseName(apartment.name);
        const { data, error } = await supabase
          .from('bookings')
          .select('check_in, check_out')
          .eq('apartment_name', baseName);

        if (error) throw error;

        const allDates: Date[] = [];
        data.forEach(booking => {
          const start = parseISO(booking.check_in);
          const end = parseISO(booking.check_out);
          const daysInRange = eachDayOfInterval({ start, end: subDays(end, 1) });
          allDates.push(...daysInRange);
        });

        const uniqueDates = Array.from(
          new Set(allDates.map(date => format(date, 'yyyy-MM-dd')))
        ).map(dateStr => parseISO(dateStr));

        setBookedDates(uniqueDates);
      } catch (err) {
        console.error('Error fetching booked dates:', err);
        setError('Failed to fetch available dates');
      }
    }

    fetchBookedDates();
  }, [apartment.name]);

  const calculateTotalPrice = (numberOfNights: number) => {
    let totalPrice = numberOfNights * apartment.price_per_night;
    
    if (bookingDetails.hasPets) {
      totalPrice += 10;
    }
    
    if (apartment.id === 'pikulas' && bookingDetails.extraBed) {
      totalPrice += 15;
    }

    if (appliedCoupon) {
      const discount = totalPrice * (appliedCoupon.discount_percent / 100);
      totalPrice -= discount;
    }

    return totalPrice;
  };

  const validateCoupon = async (code: string) => {
    setIsValidatingCoupon(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error) throw error;

      if (data) {
        setAppliedCoupon(data as Coupon);
        return true;
      }

      setError('Invalid or expired coupon code');
      setAppliedCoupon(null);
      return false;
    } catch (err) {
      console.error('Error validating coupon:', err);
      setError('Failed to validate coupon');
      setAppliedCoupon(null);
      return false;
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setError('Please enter a coupon code');
      return;
    }
    await validateCoupon(couponCode.trim());
  };

  const isDateBooked = (date: Date) => {
    return bookedDates.some(bookedDate => isSameDay(bookedDate, date));
  };

  const handleDateChange = (type: 'checkIn' | 'checkOut', date: Date | null) => {
    if (!date) return;

    const newBookingDetails = { ...bookingDetails };

    if (type === 'checkIn') {
      if (isDateBooked(date)) {
        setError('This date is already booked');
        return;
      }
      newBookingDetails.checkIn = date;
      if (bookingDetails.checkOut && date >= bookingDetails.checkOut) {
        newBookingDetails.checkOut = undefined;
      }
    } else {
      if (isDateBooked(date)) {
        setError('This date is already booked');
        return;
      }
      newBookingDetails.checkOut = date;
    }

    if (newBookingDetails.checkIn && newBookingDetails.checkOut) {
      const daysToCheck = eachDayOfInterval({
        start: newBookingDetails.checkIn,
        end: newBookingDetails.checkOut,
      });

      if (daysToCheck.some(date => isDateBooked(date))) {
        setError('Some days in this range are already booked');
        return;
      }
    }

    setBookingDetails(newBookingDetails);
    setError(null);
  };

  const handleNextStep = () => {
    if (!bookingDetails.checkIn || !bookingDetails.checkOut) {
      setError('Prašome pasirinkti atvykimo ir išvykimo datas');
      return;
    }
    setStep(2);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptedRules) {
      setError('Prašome susipažinti ir sutikti su taisyklėmis prieš tęsiant');
      return;
    }

    const { checkIn, checkOut, guestEmail, guestName, country, phoneNumber, numberOfGuests } = bookingDetails;

    if (!checkIn || !checkOut || !guestEmail || !guestName || !country || !phoneNumber || !numberOfGuests) {
      setError('Prašome užpildyti visus privalomus laukus');
      return;
    }

    if (checkOut <= checkIn) {
      setError('Išvykimo data turi būti vėlesnė nei atvykimo data');
      return;
    }

    setShowSummary(true);
  };

  const handleConfirmBooking = async () => {
    if (!acceptedRules) {
      setError('Prašome susipažinti ir sutikti su taisyklėmis prieš tęsiant');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { checkIn, checkOut, guestEmail, guestName, country, phoneNumber, numberOfGuests, hasPets, extraBed } = bookingDetails;

      if (!checkIn || !checkOut || !guestEmail || !guestName || !country || !phoneNumber || !numberOfGuests) {
        throw new Error('Please fill in all required fields');
      }

      // Double-check dates availability
      const { data: latestBookings } = await supabase
        .from('bookings')
        .select('check_in, check_out')
        .eq('apartment_name', getApartmentBaseName(apartment.name));

      const newBookingDates = eachDayOfInterval({ start: checkIn, end: checkOut });
      const isStillAvailable = !newBookingDates.some(date => 
        latestBookings?.some(booking => 
          isSameDay(date, parseISO(booking.check_in)) || 
          isSameDay(date, parseISO(booking.check_out))
        )
      );

      if (!isStillAvailable) {
        throw new Error('Selected dates are no longer available. Please choose different dates.');
      }

      const numberOfNights = differenceInDays(checkOut, checkIn);
      const totalPrice = calculateTotalPrice(numberOfNights);
      const priceInCents = Math.round(totalPrice * 100);

      const params = new URLSearchParams({
        mode: 'payment',
        success_url: `${window.location.origin}/success`,
        cancel_url: `${window.location.origin}/cancel`,
        customer_email: guestEmail,
        'line_items[0][price_data][currency]': 'eur',
        'line_items[0][price_data][product_data][name]': apartment.name,
        'line_items[0][price_data][unit_amount]': priceInCents.toString(),
        'line_items[0][quantity]': '1',
        'metadata[apartmentId]': apartment.id,
        'metadata[apartmentName]': getApartmentBaseName(apartment.name),
        'metadata[checkIn]': checkIn.toISOString(),
        'metadata[checkOut]': checkOut.toISOString(),
        'metadata[email]': guestEmail,
        'metadata[guestName]': guestName,
        'metadata[country]': country,
        'metadata[phoneNumber]': phoneNumber,
        'metadata[numberOfGuests]': numberOfGuests.toString(),
        'metadata[hasPets]': hasPets ? 'true' : 'false',
        'metadata[extraBed]': extraBed ? 'true' : 'false',
        'metadata[price]': totalPrice.toString(),
        'metadata[acceptedRules]': 'true',
      });

      if (appliedCoupon) {
        params.append('metadata[couponCode]', appliedCoupon.code);
        params.append('metadata[discountPercent]', appliedCoupon.discount_percent.toString());
      }

      const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer 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`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      const text = await response.text();

      if (!response.ok) {
        console.error('Stripe error:', text);
        throw new Error('Failed to create checkout session');
      }

      const session = JSON.parse(text);
      window.location.href = session.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setShowSummary(false);
    } finally {
      setIsLoading(false);
    }
  };

  const numberOfNights = bookingDetails.checkIn && bookingDetails.checkOut
    ? differenceInDays(bookingDetails.checkOut, bookingDetails.checkIn)
    : 0;

  const totalPrice = calculateTotalPrice(numberOfNights);

  if (showRules) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-white rounded-2xl p-8 max-w-3xl w-full shadow-2xl relative my-8">
          <button
            onClick={() => setShowRules(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">Vidaus tvarkos taisyklės</h2>

          <div className="prose prose-sm max-w-none overflow-y-auto max-h-[70vh] pr-4">
            <h3 className="text-xl font-bold mb-4">Taisyklės, kuriomis saugome ramybę ir bendrystę.</h3>

            <p className="mb-6">
              Šios taisyklės sukurtos tam, kad mūsų nuomuojami namai, juos supanti gamta ir Jūsų poilsis būtų saugūs, harmoningai sugyventų tarpusavyje. Rezervuodami apsistojimą Girios Horizonte ir atvykdami į mūsų erdves, patvirtinate, kad susipažinote su šiomis taisyklėmis ir joms pritariate. Jei jaučiate, kad šios taisyklės Jums netinka – kviečiame susilaikyti nuo rezervacijos. Kiekvienas svečias, atvykstantis į Girios Horizontą, įsipareigoja atsakingai perskaityti šias taisykles bei kitą informaciją, kurią taip pat galite rasite, kai atliksite rezervaciją.
            </p>

            <div className="mb-6">
              <p className="font-semibold">Atvykimo laikas nuo 15:00</p>
              <p className="font-semibold">Išvykimo laikas iki 11:00</p>
            </div>

            <p className="mb-6">
              Apmokėjus rezervaciją, Jūs patvirtinate, kad sutinkate su visomis mūsų taisyklėmis. Neišbuvus numatyto(rezervuoto) laiko, pinigai negražinami.
            </p>

            <h3 className="text-lg font-bold mb-4">REZERVACIJOS ATŠAUKIMAS/PERKĖLIMAS</h3>
            <p className="mb-6">
              Rezervacijas atšaukti, perkelti rezervacijos datą galima likus ne mažiau nei 10 dienų iki atvykimo datos. Galimas 100% pinigų grąžinimas. Vėliau rezervacijų atšaukimas negalimas dėl jokių priežasčių – pasikeitusių planų, ligų ar kitų aplinkybių. Jūsų rezervacijos laiku galimas ir kitų žmonių atvykimas, bet apie tai reikia pranešti iš anksto. Taip pat atvykstantieji žmonės turi būti susipažinę su mūsų sąlygomis ir taisyklėmis. Perkėlus datą, jei tos datos suma mažesnė – skirtumas negrąžinamas, jei tos datos suma didesnė, reikalinga skirtumo priemoka. Rezervacijos perkėlimas galimas tik vieną kartą. Rezervuojant mūsų paslaugas, Jūs sutinkate, kad Jūsų asmens duomenys bus naudojami rezervavimo procedūrai įvykdyti (pagal 1997-09-28 sutarties dėl asmens duomenų apsaugos sąlygas).
            </p>

            <h3 className="text-lg font-bold mb-4">AUGINTINIAI</h3>
            <p className="mb-6">
              Priimame ir Jūsų augintinius. PRIIMAME TIK ŠUNIS. Sumokėjus papildomą 10 eur mokestį galima atvykti su naminiais gyvūnais. Gyvūno paliktas išmatas privalo surinkti jo šeimininkai. Už bet kokią augintinių padarytą žalą atsako jų šeimininkai. Priimami tik sveiki, neagresyvūs, stabilios psichikos gyvūnai. Svečias, atvykęs su augintiniu, yra atsakingas už Girios Horizonte gyvenantį gyvūną ir įsipareigoja laikytis šių taisyklių bei visiškai atlyginti gyvūno padarytą žalą Girios Horizonto, teritorijai ir/ar tretiesiems asmenims. Laikant gyvūną namelyje nesuderinus iš anksto - taikoma 100 Eur/d. bauda.
            </p>

            <h3 className="text-lg font-bold mb-4">POILSIAUTOJAMS DRAUDŽIAMA</h3>
            <ul className="list-disc pl-5 mb-6">
              <li>Rūkyti Girios Horizonto teritorijoje griežtai draudžiama. Negalimas ir elektroninių cigarečių, "woopų" ir panašaus tipo rūkymo priemonių, kaljanų naudojimas apartamentų, namelių bei namo ir pirties viduje.</li>
              <li>Draudžiama triukšmauti, garsiai klausytis muzikos. Girios Horizonto teritorija skirta tik ramiam poilsiui, tad labai prašome gerbti visų privatumą ir ramybę. Ramybės bei tylos laikas nuo 22:00 - 08:00.</li>
              <li>Šiukšlinti ar kitaip niokoti teritoriją ar namelių bei pirties vidaus inventorių.</li>
              <li>Pasikviesti papildomų draugų, žmonių nei nakvynei, nei trumpam pabuvimui - griežtai draudžiama.</li>
              <li>Nesimaudykite apsvaigę nuo alkoholio ar kitų psichiką veikiančių medžiagų.</li>
            </ul>

            <h3 className="text-lg font-bold mb-4">PRIEŠGAISRINĖS SAUGOS IR SAUGAUS ELGESIO TAISYKLĖS</h3>
            <ul className="list-disc pl-5 mb-6">
              <li>Kadangi Girios Horizontas yra įsikūręs miškingoje teritorijoje, tai bet kokios ugnies kūrenimas lauke, Girios Horizonto teritorijoje negalimas ir draudžiamas iškyrūs tam padarytas specialias laužavietes ir griliaus vietas.</li>
              <li>Žvakės lauke gali būti degamos tik su priežiūra ir specialiuose induose. Be priežiūros uždegtų žvakių žibintuose palikti negalima.</li>
              <li>Patalpose žvakes galima deginti tik tam skirtose žvakidėse, žvakių be priežiūros palikti negalima.</li>
              <li>Gintaro namo viduje esantį židinį galima kūrenti, bet tik su priežiūra ir GRIEŽTAI draudžiama palikti židinį su degančią ar rusenančia liepsna. Galima kūrenti tik malkas jokių kitų atliekų negalima dėti į židinį. Laikytis saugaus atstumo nuo židinio.</li>
              <li>Visoje Girios Horizonto teritorijoje draudžiama naudoti fejerverkus.</li>
              <li>Naudotis elektros prietaisais, laikantis saugumo reikalavimų.</li>
              <li>Nepalikti be priežiūros įjungtų elektros prietaisų.</li>
            </ul>

            <h3 className="text-lg font-bold mb-4">POILSIAUTOJŲ ATSAKOMYBĖ</h3>
            <ul className="list-disc pl-5 mb-6">
              <li>Už atsivežto maisto kokybę ir šviežumą, atsako patys poilsiautojai.</li>
              <li>Poilsiautojui susižalojus pačiam arba sužalojus savo turtą dėl savo kaltės, pažeidžiant saugaus elgesio, priešgaisrines ir vidaus tvarkos taisykles, paslaugos teikėjas už tai neatsako.</li>
              <li>Už nelaimingus atsitikimus, galinčius įvykti Girios Horizonto teritorijoje ar už jos ribų (apartamentų, namo ar namelio viduje, terasoje, visoje teritorijoje, maudantis ežere, dviračių žygyje ir t.t.) yra atsakingi patys poilsiautojai.</li>
              <li>Už nelaimingus atsitikimus, įvykusius dėl alkoholio, atsako pats poilsiautojas.</li>
              <li>Poilsiautojai visiškai materialiai atsako už sugadintą ar sunaikintą nameliuose ir Girios Horizonto teritorijoje esantį kilnojamąjį ir nekilnojamąjį turtą, bei materialines vertybes (už padarytą materialinę žalą poilsiautojas atsako LR įstatymų nustatyta tvarka).</li>
              <li>Dėl poilsiautojų neatsargumo kilus gaisrui, kuris sugadino namelius ar aplinkines teritorijas, už visus dėl to atsiradusius nuostolius atsako poilsiautojai.</li>
              <li>Aparatamentuose, nameliuose ir name, ir jų teritorijoje esantys daiktai yra sodybos nuosavybė, todėl poilsiautojas (-iai) neturi teisės juos pasiimti išvykdamas iš sodybos.</li>
              <li>Jei pastebite kokius gedimus ar pažeidimus, praneškite nedelsdami. Už sugadintus prietaisus, ilgalaikį ir trumpalaikį turtą taikoma bauda, kurią įvardija Girios Horizonto administracija.</li>
              <li>Atvykus su vaikais, rūpintis jų saugumu. Už jų priežiūrą teritorijoje atsakomybę prisiima tėvai/globėjai, su kuriais jis atvyko.</li>
              <li>Iškylaujant lauke nenaudoti kambaryje esančių pledukų (nebent apsijuosti), rakšluosčių, antklodžių ar pagalvėlių.</li>
              <li>Girios Horizonto administratoriai turi teisę išprašyti iš teritorijos tuos lankytojus, kurie nesilaiko vidaus taisyklių, savo elgesiu ir veiksmais daro žalą teritorijos infrastruktūrai. Tokiu atveju rezervacijos mokestis negrąžinamas.</li>
            </ul>

            <h3 className="text-lg font-bold mb-4">PIRTIES DRUSKA TAISYKLĖS</h3>
            <ul className="list-disc pl-5 mb-6">
              <li>Į pirtį prašome ateiti ir išeiti numatytu ir jums paskirtu laiku, - kadangi prieš jus ar po jūsų, pirtyje gali lankytis ir kiti svečiai.</li>
              <li>Pirties zonoje rekomenduojame turėti ir avėti šlepetes, atkreipkite dėmesį, grindys gali būti slidžios.</li>
              <li>Rekomenduojama alkoholio nevartoti pirties procedūrų metu.</li>
              <li>Muzikos galima klausytis tik ne ramybės ir tylos laiku (nuo 22:00-08:00)</li>
              <li>Panaudotus Arbatos puodelius, vyno taures ar kitus indus privaloma išsiplauti ir padėti į vietą.</li>
              <li>Pirties reikiamą tekstilę, svečiai įsipareigoja turėti savo asmeninę (rankšluosčiai, chalatai, šlepetės ir pan).</li>
            </ul>

            <h3 className="text-lg font-bold mb-4">PIRTYJE DRUSKA DRAUDŽIAMA</h3>
            <ul className="list-disc pl-5 mb-6">
              <li>Pirtyje naudoti savo šveitiklius, aliejus, mesų ar kitas priemones.</li>
              <li>Šokinėti nuo lieptelio į ežerą. Ežeras seklus ir yra dumblo.</li>
              <li>Pirties patalpose bei visoje teritorijoje rūkyti(garinti).</li>
              <li>Triukšmauti.</li>
              <li>Pirties lankytojai pilnai atsakingi už savo sveikatą ir saugumą.</li>
              <li>švykstant, paliekame pirties patalpas tvarkingas.</li>
              <li>Išeinant iš pirties, išjungti visur apšvietimą.</li>
              <li>Išeinant iš pirties, užrakinti pirties pastato duris, raktą palikti dėžutėje, kur jį ir radote, dėžutę užrakinti.</li>
            </ul>

            <p className="mb-6">
              Už padarytą materialinę žalą lankytojai atsako LR įstatymų numatyta tvarka. Šeimininkams nuostoliai padengiami prieš išvykstant.
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => setShowRules(false)}
              className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-xl font-medium transition-colors"
            >
              Grįžti į rezervaciją
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showSummary) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl relative my-8">
          <button
            onClick={() => setShowSummary(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">Užsakymo santrauka</h2>

          <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Apartamentai</span>
                <span className="font-medium">{apartment.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Atvykimas</span>
                <span className="font-medium">{format(bookingDetails.checkIn!, 'yyyy-MM-dd')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Išvykimas</span>
                <span className="font-medium">{format(bookingDetails.checkOut!, 'yyyy-MM-dd')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Svečias</span>
                <span className="font-medium">{bookingDetails.guestName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">El. paštas</span>
                <span className="font-medium">{bookingDetails.guestEmail}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Šalis</span>
                <span className="font-medium">{bookingDetails.country}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Telefonas</span>
                <span className="font-medium">{bookingDetails.phoneNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Svečių skaičius</span>
                <span className="font-medium">{bookingDetails.numberOfGuests}</span>
              </div>
              {bookingDetails.hasPets && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Augintinio mokestis</span>
                  <span className="font-medium">10€</span>
                </div>
              )}
              {apartment.id === 'pikulas' && bookingDetails.extraBed && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Papildoma lova</span>
                  <span className="font-medium">15€</span>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Kaina už naktį</span>
                <span className="font-medium">{apartment.price_per_night}€</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Naktų skaičius</span>
                <span className="font-medium">{numberOfNights}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between items-center mb-2 text-green-600">
                  <span>Nuolaida ({appliedCoupon.discount_percent}%)</span>
                  <span>-{(numberOfNights * apartment.price_per_night * (appliedCoupon.discount_percent / 100)).toFixed(2)}€</span>
                </div>
              )}
              <div className="flex justify-between items-center text-lg font-bold mt-4 pt-4 border-t border-gray-200">
                <span>Viso</span>
                <span>{totalPrice.toFixed(2)}€</span>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <button
              onClick={handleConfirmBooking}
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-xl font-medium transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Apdorojama...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Patvirtinti užsakymą
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Calendar className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Rezervacija</h2>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {step === 1 ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Atvykimo data
                </label>
                <DatePicker
                  selected={bookingDetails.checkIn}
                  onChange={(date) => handleDateChange('checkIn', date)}
                  minDate={new Date()}
                  excludeDates={bookedDates}
                  dateFormat="yyyy-MM-dd"
                  locale={lt}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-white"
                  placeholderText="Pasirinkite datą"
                  showPopperArrow={false}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Išvykimo data
                </label>
                <DatePicker
                  selected={bookingDetails.checkOut}
                  onChange={(date) => handleDateChange('checkOut', date)}
                  minDate={bookingDetails.checkIn || new Date()}
                  excludeDates={bookedDates}
                  dateFormat="yyyy-MM-dd"
                  locale={lt}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-white"
                  placeholderText="Pasirinkite datą"
                  showPopperArrow={false}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Svečių skaičius
              </label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="number"
                  min="1"
                  max="4"
                  value={bookingDetails.numberOfGuests || 2}
                  onChange={(e) => setBookingDetails({ ...bookingDetails, numberOfGuests: parseInt(e.target.value) })}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={bookingDetails.hasPets || false}
                  onChange={(e) => setBookingDetails({ ...bookingDetails, hasPets: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-gray-700">Augintinio mokestis (10€)</span>
              </label>

              {apartment.id === 'pikulas' && (
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={bookingDetails.extraBed || false}
                    onChange={(e) => setBookingDetails({ ...bookingDetails, extraBed: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-gray-700">Papildoma lova (15€)</span>
                </label>
              )}
            </div>

            <div className="bg-gray-50 rounded-xl p-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Kaina už naktį</span>
                <span className="font-medium">{apartment.price_per_night}€</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Naktų skaičius</span>
                <span className="font-medium">{numberOfNights}</span>
              </div>
              {bookingDetails.hasPets && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Augintinio mokestis</span>
                  <span className="font-medium">10€</span>
                </div>
              )}
              {apartment.id === 'pikulas' && bookingDetails.extraBed && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Papildoma lova</span>
                  <span className="font-medium">15€</span>
                </div>
              )}
              <div className="flex justify-between items-center text-lg font-bold pt-3 border-t border-gray-200">
                <span>Viso</span>
                <span>{totalPrice.toFixed(2)}€</span>
              </div>
            </div>

            <button
              onClick={handleNextStep}
              className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-xl font-medium transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Tęsti rezervaciją
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vardas Pavardė
              </label>
              <input
                type="text"
                value={bookingDetails.guestName || ''}
                onChange={(e) => setBookingDetails({ ...bookingDetails, guestName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Įveskite vardą ir pavardę"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                El. pašto adresas
              </label>
              <input
                type="email"
                value={bookingDetails.guestEmail || ''}
                onChange={(e) => setBookingDetails({ ...bookingDetails, guestEmail: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Įveskite el. paštą"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Šalis
              </label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={bookingDetails.country || ''}
                  onChange={(e) => setBookingDetails({ ...bookingDetails, country: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Įveskite šalį"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefono numeris
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  value={bookingDetails.phoneNumber || ''}
                  onChange={(e) => setBookingDetails({ ...bookingDetails, phoneNumber: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="+370"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Nuolaidos kodas"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={isValidatingCoupon}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 disabled:opacity-50 transition-colors"
              >
                {isValidatingCoupon ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Tag className="w-5 h-5" />
                )}
              </button>
            </div>

            {appliedCoupon && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
                <Check className="w-5 h-5" />
                <p>Pritaikyta nuolaida: {appliedCoupon.discount_percent}%</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="rules-acceptance"
                  checked={acceptedRules}
                  onChange={(e) => setAcceptedRules(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div>
                  <label htmlFor="rules-acceptance" className="text-gray-700 font-medium">
                    Susipažinau su Vidaus tvarkos taisyklėmis ir su jomis sutinku
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowRules(true)}
                    className="block text-sm text-primary hover:text-primary-dark mt-1 flex items-center gap-1"
                  >
                    <Info className="w-4 h-4" />
                    Peržiūrėti taisykles
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-medium transition-colors hover:bg-gray-200"
              >
                Grįžti atgal
              </button>
              <button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary-dark text-white py-4 rounded-xl font-medium transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Tęsti
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}