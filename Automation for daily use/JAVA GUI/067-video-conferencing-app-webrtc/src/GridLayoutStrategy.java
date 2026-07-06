/**
 * Computes the tile grid dimensions for N participants using the same
 * "near-square, favor wider" heuristic real conferencing apps (Meet/Zoom)
 * use: 1 participant fills the screen, 2 sit side-by-side, 3-4 form a
 * 2x2, and beyond that it grows as ceil(sqrt(n)) columns so tiles stay
 * roughly square instead of thin slivers.
 */
public final class GridLayoutStrategy {

    private GridLayoutStrategy() {
    }

    public record Dimensions(int columns, int rows) {
    }

    public static Dimensions compute(int participantCount) {
        if (participantCount <= 0) {
            return new Dimensions(1, 1);
        }
        if (participantCount == 1) {
            return new Dimensions(1, 1);
        }
        if (participantCount == 2) {
            // Side-by-side reads better than a 1x2 stack on a wide window.
            return new Dimensions(2, 1);
        }

        int columns = (int) Math.ceil(Math.sqrt(participantCount));
        int rows = (int) Math.ceil((double) participantCount / columns);
        return new Dimensions(columns, rows);
    }
}
