function nthOccurrence(string, char, nth) {
  var first_index = string.indexOf(char);
  var length_up_to_first_index = first_index + 1;

  if (nth === 1) {
    return first_index;
  } else {
    var string_after_first_occurrence = string.slice(length_up_to_first_index);
    var next_occurrence = nthOccurrence(
      string_after_first_occurrence,
      char,
      nth - 1
    );

    if (next_occurrence === -1) {
      return -1;
    } else {
      return length_up_to_first_index + next_occurrence;
    }
  }
}

export default nthOccurrence;
