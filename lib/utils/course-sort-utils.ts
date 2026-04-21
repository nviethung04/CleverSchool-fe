/**
 * Utility functions for sorting courses
 * 
 * Sắp xếp khóa học theo quy tắc:
 * 1. Ưu tiên theo chữ cái đầu (alphabet)
 * 2. Nếu cùng chữ cái, sắp xếp theo số xuất hiện đầu tiên
 * 3. Nếu cùng cả hai, sắp xếp theo phần còn lại
 * 
 * Ví dụ: "A 1-2b" -> "A 2-2b" -> "B 2-2b"
 */

interface ParsedCourseName {
  letter: string;
  number: number | null;
  rest: string;
  original: string;
}

/**
 * Parse tên khóa học thành các phần để so sánh
 * @param courseName - Tên khóa học (ví dụ: "A 1-2b")
 * @returns Object chứa chữ cái đầu, số đầu tiên và phần còn lại
 */
function parseCourseName(courseName: string): ParsedCourseName {
  if (!courseName || typeof courseName !== "string") {
    return {
      letter: "",
      number: null,
      rest: courseName || "",
      original: courseName || "",
    };
  }

  const trimmed = courseName.trim();
  if (trimmed.length === 0) {
    return {
      letter: "",
      number: null,
      rest: "",
      original: courseName,
    };
  }

  // Lấy chữ cái đầu tiên (nếu có)
  const firstChar = trimmed[0];
  const isLetter = /[a-zA-ZÀ-ỹ]/.test(firstChar);
  const letter = isLetter ? firstChar.toUpperCase() : "";

  // Tìm số đầu tiên xuất hiện trong chuỗi
  const numberMatch = trimmed.match(/\d+/);
  const number = numberMatch ? parseInt(numberMatch[0], 10) : null;

  // Phần còn lại (sau chữ cái đầu và số đầu tiên)
  let rest = trimmed;
  if (isLetter && trimmed.length > 1) {
    rest = trimmed.substring(1).trim();
  }
  if (numberMatch) {
    // Loại bỏ số đầu tiên khỏi phần rest
    const numberIndex = rest.indexOf(numberMatch[0]);
    if (numberIndex !== -1) {
      rest = rest.substring(0, numberIndex) + rest.substring(numberIndex + numberMatch[0].length);
    }
  }
  rest = rest.trim();

  return {
    letter,
    number,
    rest,
    original: courseName,
  };
}

/**
 * So sánh hai parsed course names để sắp xếp
 */
function compareParsedNames(a: ParsedCourseName, b: ParsedCourseName): number {
  // So sánh chữ cái đầu (ưu tiên cao nhất)
  if (a.letter !== b.letter) {
    if (!a.letter) return 1; // Không có chữ cái đứng sau
    if (!b.letter) return -1;
    return a.letter.localeCompare(b.letter);
  }

  // Nếu cùng chữ cái, so sánh số
  if (a.number !== b.number) {
    if (a.number === null) return 1; // Không có số đứng sau
    if (b.number === null) return -1;
    return a.number - b.number;
  }

  // Nếu cùng cả chữ cái và số, so sánh phần còn lại
  return a.rest.localeCompare(b.rest);
}

/**
 * Sắp xếp mảng courses theo tên khóa học
 * @param courses - Mảng các course objects
 * @param nameExtractor - Function để lấy tên course từ object (mặc định: course.name)
 * @returns Mảng courses đã được sắp xếp (không mutate mảng gốc)
 */
export function sortCoursesByName<T extends Record<string, any>>(
  courses: T[],
  nameExtractor?: (course: T) => string
): T[] {
  if (!Array.isArray(courses) || courses.length === 0) {
    return courses;
  }

  const getCourseName = nameExtractor || ((course: T) => course?.name || "");

  // Tạo bản sao để không mutate mảng gốc
  const sorted = [...courses];

  // Sắp xếp với cache parsed names để tối ưu performance
  const parsedCache = new Map<string, ParsedCourseName>();

  sorted.sort((a, b) => {
    const nameA = getCourseName(a);
    const nameB = getCourseName(b);

    // Lấy hoặc tạo parsed name từ cache
    let parsedA = parsedCache.get(nameA);
    if (!parsedA) {
      parsedA = parseCourseName(nameA);
      parsedCache.set(nameA, parsedA);
    }

    let parsedB = parsedCache.get(nameB);
    if (!parsedB) {
      parsedB = parseCourseName(nameB);
      parsedCache.set(nameB, parsedB);
    }

    return compareParsedNames(parsedA, parsedB);
  });

  return sorted;
}

/**
 * Sắp xếp courses với hỗ trợ object_title trong ngoặc
 * Nếu có object_title, sẽ sắp xếp theo name trước, sau đó theo object_title
 * @param courses - Mảng các course objects có thuộc tính name và object_title (optional)
 * @returns Mảng courses đã được sắp xếp
 */
export function sortCoursesWithObjectTitle<T extends { name?: string; object_title?: string }>(
  courses: T[]
): T[] {
  if (!Array.isArray(courses) || courses.length === 0) {
    return courses;
  }

  const sorted = [...courses];
  const parsedCache = new Map<string, ParsedCourseName>();

  sorted.sort((a, b) => {
    const nameA = a?.name || "";
    const nameB = b?.name || "";

    // So sánh name trước
    let parsedA = parsedCache.get(nameA);
    if (!parsedA) {
      parsedA = parseCourseName(nameA);
      parsedCache.set(nameA, parsedA);
    }

    let parsedB = parsedCache.get(nameB);
    if (!parsedB) {
      parsedB = parseCourseName(nameB);
      parsedCache.set(nameB, parsedB);
    }

    const nameCompare = compareParsedNames(parsedA, parsedB);
    if (nameCompare !== 0) {
      return nameCompare;
    }

    // Nếu name giống nhau, so sánh object_title
    const objectTitleA = a?.object_title || "";
    const objectTitleB = b?.object_title || "";

    if (objectTitleA !== objectTitleB) {
      let parsedTitleA = parsedCache.get(objectTitleA);
      if (!parsedTitleA) {
        parsedTitleA = parseCourseName(objectTitleA);
        parsedCache.set(objectTitleA, parsedTitleA);
      }

      let parsedTitleB = parsedCache.get(objectTitleB);
      if (!parsedTitleB) {
        parsedTitleB = parseCourseName(objectTitleB);
        parsedCache.set(objectTitleB, parsedTitleB);
      }

      return compareParsedNames(parsedTitleA, parsedTitleB);
    }

    return 0;
  });

  return sorted;
}

