// Mario (less comfortable), a CS50 classic:
// print a right-aligned pyramid of height 1 to 8.
// A loop inside a loop, like Seats in Problem Set 1.
#include <cs50.h>
#include <stdio.h>

int main(void)
{
    // Prompt for a height between 1 and 8
    int height;
    do
    {
        height = get_int("Height: ");
    }
    while (height < 1 || height > 8);

    // #region loop
    // Each row: (height - i) spaces, then i hashes
    for (int i = 1; i <= height; i++)
    {
        for (int j = 0; j < height - i; j++)
        {
            printf(" ");
        }
        for (int k = 0; k < i; k++)
        {
            printf("#");
        }
        printf("\n");
    }
    // #endregion loop
}
