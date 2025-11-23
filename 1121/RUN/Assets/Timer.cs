using UnityEngine;
using UnityEngine.UI;

public class Timer : MonoBehaviour
{
    // Start is called once before the first execution of Update after the MonoBehaviour is created
    void Start()
    {
        time = 0;
    }

    // Update is called once per frame
    void Update()
    {
        if (GoalArea.goal == false)
        {
            time += Time.deltaTime;
        }

        int t = Mathf.FloorToInt(time);
        Text uiText = GetComponent<Text>();
        uiText.text = "Time : " + t.ToString();
    }
}
