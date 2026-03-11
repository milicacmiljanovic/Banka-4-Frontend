# Banka-4 Frontend

## Tech Stack

- React 19 + Vite  
- React Router v7  
- Zustand (state management)  
- Axios (HTTP klijent)  
- GSAP 3 (animacije)  
- CSS Modules  

---

## Struktura projekta
```
src/
├── api/ Axios klijent i endpoint definicije
│ ├── client.js Axios instanca, interceptori, refresh token
│ └── endpoints/ API pozivi grupisani po feature
├── animations/ GSAP hookovi (usePageTransition)
├── components/
│ ├── layout/ Navbar, ChangePasswordModal
│ └── ui/ Alert, Spinner
├── features/
│ └── employees/ EmployeeTable, EmployeeFilters
├── hooks/ useFetch, useDebounce
├── pages/ Jedna stranica = jedna ruta
├── store/ Zustand store (auth)
├── styles/ CSS varijable
└── utils/ Validacija, helperi
```

---

## Kloniranje repozitorijuma

Da biste preuzeli projekat pratite sledeće korake:

1. Otvorite repozitorijum **Banka-4-Frontend** na GitHub-u  
2. Kliknite na zeleno dugme **Code**  
3. Kopirajte URL za kloniranje:
     ```https://github.com/RAF-SI-2025/Banka-4-Frontend.git```

4. U okruženju (npr. **VS Code** ili **JetBrains IDE**) izaberite opciju **Clone Repository**  
5. Nalepite kopirani link i klonirajte projekat na svoj računar

---

## Rad sa granama (Branches)

1. Kada klonirate projekat bićete na **main** grani  
2. Potrebno je da napravite novu granu za svoj rad

Naziv grane treba da bude na engleskom i da opisuje šta radite, na primer:

- `login-page`
- `card-transactions`
- `fix-navbar-bug`

3. Kada završite deo posla uradite **commit**  
   Komentar commita treba da bude kratak i da opisuje šta je urađeno

4. Nakon commita uradite **push** na svoju granu

5. Nakon toga idete na GitHub i pravite **Pull Request**

---

## Pull Request

Kada završite rad na kartici:

1. Idite na GitHub repozitorijum **Banka-4-Frontend**
2. Pojaviće se obaveštenje da možete da napravite **Pull Request**
3. Kliknite na **Create Pull Request**
4. Dodajte kratak opis promena koje ste napravili
5. Nakon toga pull request će biti pregledan i biće odobren ili ćete dobiti komentar šta treba da izmenite

---

## Pokretanje projekta

U terminalu pokrenite sledeće komande:

- `npm install` → instalacija svih potrebnih biblioteka  
- `npm run dev` → pokretanje development servera  

---

## Pokretanje aplikacije

Nakon pokretanja projekta u konzoli će se pojaviti poruka da je aplikacija dostupna na:
```http://localhost:5173/```


