from js import document, window
import sys
from io import StringIO


document.getElementById("consoleOutput").textContent = "Pyscript Çalışıyor!\n"
output_element = document.getElementById("consoleOutput")


from js import document, window
import sys
from io import StringIO

output_element = document.getElementById("consoleOutput")
input_element = document.getElementById("consoleInput")

def handle_keypress(event):
    if event.key == "Enter":
        output_element.textContent += "Enter Tuşuna Basıldı!\n"
        input_element.value = ""

input_element.addEventListener("keypress", handle_keypress)
output_element.textContent += "# Seyahat Bütçe Planlama Konsolu\nKomutları girin (örn: istanbul riga 4 40000):\n"


def budget_hesap(budget, konak_suresi, ucak, gunluk_otel):
    budget -= ucak
    budget -= konak_suresi * gunluk_otel
    return budget

def display_etkinlikler(varis_sehri, kalan_para):
    etkinlikler = {
        "riga": [("Riga Motor Müzesi", 522), ("Riga Katedrali", 217), ("Letonya Ulusal Müzesi", 348), "Üç Kardeşler Binaları, Basteljkalna Park (Ücretsiz)"],
        "lublin": [("Lubelska Trasa Podziemna", 377), ("Lublin Kalesi", 204), ("Aqua Lublin", 346), ("Lublin Köyü Açıkhava Müzesi", 306), "Shotbar U-Boot Lublin (Ücretsiz)"],
        "new york": [("Modern Sanatlar Müzesi", 1149), ("Empire State Binası", 2044), ("Özgürlük Heykeli", 977), "Central Park (Ücretsiz)"],
        "barselona": [("La Sagrada Familia", 1135), ("Casa Batlló", 1266), ("Barselona Katedrali", 698), "Barselona Ücretsiz Etkinlikler (Park, Sokak Sanatları)"],
        "moskova": [("Aziz Vasil Katedrali", 922), ("Bolşoy Tiyatrosu", 922), "Kızıl Meydan (Ücretsiz)"],
        "madrid": ["Plaza Mayor (Ücretsiz)", ("Prado Müzesi", 654), ("Madrid Kraliyet Sarayı", 610), "Madrid Ücretsiz Etkinlikler (Parklar, Sokak Gösterileri)"],
    }
    output_element.textContent += "\nÖnerilen Etkinlikler:\n"
    if varis_sehri in etkinlikler:
        for etkinlik in etkinlikler[varis_sehri]:
            if isinstance(etkinlik, tuple) and kalan_para >= etkinlik[1]:
                output_element.textContent += f"✓ {etkinlik[0]} ({etkinlik[1]:.2f} TL)\n"
                kalan_para -= etkinlik[1]
            elif isinstance(etkinlik, str):
                output_element.textContent += f"✓ {etkinlik}\n"
    return kalan_para

def handle_input(event):
    if event.key == "Enter":
        user_input = document.getElementById("consoleInput").value.lower()
        document.getElementById("consoleInput").value = ""
        output_element.textContent += f"\n>>> {user_input}\n"
        try:
            komutlar = user_input.split()
            if len(komutlar) == 4:
                kalkis_sehri, varis_sehri, konak_suresi_str, butce_str = komutlar[0], komutlar[1], komutlar[2], komutlar[3]
                konak_suresi = int(konak_suresi_str)
                butce = int(butce_str)

                ucak_fiyati = {
                    "riga": 10420 * 2,
                    "lublin": 12225 * 2,
                    "new york": 11479 * 2,
                    "moskova": 5414 * 2,
                    "barselona": 5038 * 2,
                    "madrid": 8520 * 2,
                }
                otel_fiyati = {
                    "riga": 3600,
                    "lublin": 3108,
                    "new york": 6400,
                    "moskova": 3431,
                    "barselona": 9249,
                    "madrid": 4665,
                }

                if varis_sehri not in ucak_fiyati:
                    output_element.textContent += "Geçersiz varış şehri.\n"
                    return

                kalan_butce = budget_hesap(butce, konak_suresi, ucak_fiyati[varis_sehri], otel_fiyati[varis_sehri])
                output_element.textContent += f"Konaklama ve uçuş sonrası kalan bütçe: {kalan_butce:.2f} TL\n"

                kalan_butce = display_etkinlikler(varis_sehri, kalan_butce)
                output_element.textContent += f"Son kalan bütçe: {kalan_butce:.2f} TL\n"
            else:
                output_element.textContent += "Geçersiz komut formatı. Lütfen 'kalkis varis gun butce' şeklinde girin (örn: istanbul riga 4 40000).\n"
        except ValueError:
            output_element.textContent += "Geçersiz sayısal giriş yaptınız (gün veya bütçe).\n"
        except Exception as e:
            output_element.textContent += f"Bir hata oluştu: {e}\n"
        finally:
            output_element.scrollTop = output_element.scrollHeight

document.getElementById("consoleInput").addEventListener("keypress", handle_input)
output_element.textContent += "# Seyahat Bütçe Planlama Konsolu\nKomutları girin (örn: istanbul riga 4 40000):\n"