/*
  Singing Stepper - Engr 346 DLA

    Type a command and press Enter:
    440     play 440 steps/s (= 440 Hz) until you type anything else
    w f h   wave / full / half step mode
    r       ramp on/off (start at 100 steps/s and speed up)
    t       test: play 10 notes, 3 s each, 1 s quiet between
    p       play the Alphabet song ( Just for fun)
    + -     song one octave up / down
    s       stop
  Typing anything while the motor is playing stops it.
*/

// Counts how many items are in a list. Example: COUNT(ALPHABET) = 42
#define COUNT(list) (sizeof(list) / sizeof(list[0]))

const int PIN[4] = {8, 9, 10, 11};   // IN1, IN2, IN3, IN4

// Coil table: 1 = coil on. Columns are IN1, IN2, IN3, IN4.
// Even rows have 1 coil on (wave drive). Odd rows have 2 coils on (full step).
// Half step uses every row, so it switches between 1 and 2 coils.
const byte COILS[8][4] = {
  {1, 0, 0, 0},   // row 0
  {1, 1, 0, 0},   // row 1
  {0, 1, 0, 0},   // row 2
  {0, 1, 1, 0},   // row 3
  {0, 0, 1, 0},   // row 4
  {0, 0, 1, 1},   // row 5
  {0, 0, 0, 1},   // row 6
  {1, 0, 0, 1}    // row 7
};

// =================== INPUTS: change these, not the functions ===================

// Test notes in steps/s (= Hz)
const float TEST_NOTES[] = {262, 294, 330, 349, 392, 440, 523, 659, 784, 880};

// Note frequencies in Hz. Add more here if a new song needs them.
const float NOTE_C4 = 261.63, NOTE_D4 = 293.66, NOTE_E4 = 329.63;
const float NOTE_F4 = 349.23, NOTE_G4 = 392.00, NOTE_A4 = 440.00;

// A song is a list of {note, length} pairs.
// Length: 2 = eighth, 4 = quarter, 8 = half note
const float ALPHABET[][2] = {
  {NOTE_C4, 4}, {NOTE_C4, 4}, {NOTE_G4, 4}, {NOTE_G4, 4}, {NOTE_A4, 4}, {NOTE_A4, 4}, {NOTE_G4, 8},  // A B C D E F G
  {NOTE_F4, 4}, {NOTE_F4, 4}, {NOTE_E4, 4}, {NOTE_E4, 4},                                            // H I J K
  {NOTE_D4, 2}, {NOTE_D4, 2}, {NOTE_D4, 2}, {NOTE_D4, 2}, {NOTE_C4, 8},                              // L M N O P
  {NOTE_G4, 4}, {NOTE_G4, 4}, {NOTE_F4, 8}, {NOTE_E4, 4}, {NOTE_E4, 4}, {NOTE_D4, 8},                // Q R S, T U V
  {NOTE_G4, 4}, {NOTE_G4, 4}, {NOTE_F4, 8}, {NOTE_E4, 4}, {NOTE_E4, 4}, {NOTE_D4, 8},                // W X, Y and Z
  {NOTE_C4, 4}, {NOTE_C4, 4}, {NOTE_G4, 4}, {NOTE_G4, 4}, {NOTE_A4, 4}, {NOTE_A4, 4}, {NOTE_G4, 8},  // Now I know my A B C's
  {NOTE_F4, 4}, {NOTE_F4, 4}, {NOTE_E4, 4}, {NOTE_E4, 4}, {NOTE_D4, 4}, {NOTE_D4, 4}, {NOTE_C4, 8}   // Next time won't you sing with me
};

// ===============================================================================

const int GAP_MS = 30;  // short silence after each note

byte row = 1;        // which row of the coil table we're on
byte stepSize = 2;   // 2 for wave or full (skip every other row), 1 for half
char mode = 'f';
bool rampOn = false;
float octave = 1.0;  // 1 = as written, 0.5 = one octave down, 2 = one octave up

// Turn the coils on/off to match one row of the table
void setCoils(byte r) {
  for (int i = 0; i < 4; i++) digitalWrite(PIN[i], COILS[r][i]);
}

void allOff() {
  for (int i = 0; i < 4; i++) digitalWrite(PIN[i], LOW);
}

// One click of the motor: move to the next row
void oneStep() {
  row = (row + stepSize) % 8;
  setCoils(row);
}

void setMode(char m) {
  mode = m;
  if (m == 'w') { row = 0; stepSize = 2; }   // even rows only
  if (m == 'f') { row = 1; stepSize = 2; }   // odd rows only
  if (m == 'h') { stepSize = 1; }            // every row
  Serial.print("Mode: ");
  Serial.println(m);
}

// Print what we're about to play
void printInfo(float hz) {
  unsigned long period = 1000000.0 / hz;          // microseconds between steps
  float stepsPerRev = (stepSize == 1) ? 4096 : 2048;
  Serial.print("Mode ");          Serial.print(mode);
  Serial.print(" | commanded ");  Serial.print(hz);
  Serial.print(" | timed ");      Serial.print(1000000.0 / period);
  Serial.print(" | shaft RPM ");  Serial.println(hz * 60 / stepsPerRev);
  Serial.flush();                 // finish printing before the motor starts
}

// Step at 'hz' steps per second for 'ms' milliseconds.
// ms = 0 means keep going until you type something.
// Returns false if you typed something to stop it.
bool playTone(float hz, unsigned long ms) {
  float rate = hz;
  if (rampOn && hz > 100) rate = 100;           // ramp: start slow
  unsigned long period = 1000000.0 / rate;      // microseconds between steps
  unsigned long start = millis();
  unsigned long lastStep = micros();
  setCoils(row);

  while (ms == 0 || millis() - start < ms) {
    if (Serial.available()) {                   // you typed something: stop
      allOff();
      return false;
    }
    if (micros() - lastStep >= period) {        // time for the next step?
      lastStep += period;                       // keeps the steps evenly spaced
      oneStep();
      if (rate < hz) {                          // ramp: speed up a little each step
        rate = min(rate + 2000.0 / rate, hz);
        period = 1000000.0 / rate;
      }
    }
  }
  allOff();
  return true;
}

// Play each note in a list, with quiet between.
// Inputs: the list of notes, how many notes, on time (ms), off time (ms).
void runTest(const float notes[], int count, unsigned long onMs, unsigned long offMs) {
  Serial.println("Test start");
  for (int i = 0; i < count; i++) {
    Serial.print("[");
    Serial.print(i + 1);
    Serial.print("] ");
    printInfo(notes[i]);
    if (!playTone(notes[i], onMs)) return;     // stopped early
    delay(offMs);
  }
  Serial.println("Test done");
}

// Play a song.
// Inputs: the song (list of {note, length} pairs), how many notes, and the tempo (BPM).
// Length units: 1 = sixteenth, 2 = eighth, 4 = quarter, 8 = half note.
void playSong(const float song[][2], int count, int bpm) {
  unsigned long sixteenthMs = 15000UL / bpm;   // 60000 ms per minute / bpm / 4
  Serial.println("Song starts in 2 s...");
  delay(2000);                                 // time to start recording
  for (int i = 0; i < count; i++) {
    float hz = song[i][0] * octave;                              // column 0 = the note
    unsigned long noteMs = song[i][1] * sixteenthMs - GAP_MS;    // column 1 = the length
    Serial.println(hz);
    Serial.flush();
    if (!playTone(hz, noteMs)) return;         // play the note (stop if you typed something)
    delay(GAP_MS);
  }
  Serial.println("Song done");
}

void setup() {
  for (int i = 0; i < 4; i++) pinMode(PIN[i], OUTPUT);   // pins start LOW, so all coils start off
  Serial.begin(9600);
  Serial.println("Singing Stepper ready");
  Serial.println("Commands: number, w f h, r, t, p, + -, s");
}

void loop() {
  if (!Serial.available()) return;             // nothing typed yet

  String cmd = Serial.readStringUntil('\n');   // read what you typed
  cmd.trim();                                  // remove spaces and the Enter key
  if (cmd.length() == 0) return;
  char c = cmd[0];

  if (c == 'w' || c == 'f' || c == 'h') setMode(c);
  else if (c == 'r') {
    rampOn = !rampOn;
    Serial.println(rampOn ? "Ramp ON" : "Ramp OFF");
  }
  else if (c == 't') runTest(TEST_NOTES, COUNT(TEST_NOTES), 3000, 1000);   // notes, count, 3 s on, 1 s off
  else if (c == 'p') playSong(ALPHABET, COUNT(ALPHABET), 100);             // song, count, 100 BPM
  else if (c == '+') { octave = octave * 2; Serial.print("Octave x"); Serial.println(octave); }
  else if (c == '-') { octave = octave / 2; Serial.print("Octave x"); Serial.println(octave); }
  else if (c == 's') Serial.println("Stopped");
  else {
    float hz = cmd.toFloat();                  // turn text like "440" into a number
    if (hz >= 1 && hz <= 3000) {
      printInfo(hz);
      playTone(hz, 0);                         // play until you type something
    } else {
      Serial.println("Unknown command");
    }
  }
}
