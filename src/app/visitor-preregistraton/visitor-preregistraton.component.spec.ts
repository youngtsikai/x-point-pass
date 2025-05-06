import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisitorPreregistratonComponent } from './visitor-preregistraton.component';

describe('VisitorPreregistratonComponent', () => {
  let component: VisitorPreregistratonComponent;
  let fixture: ComponentFixture<VisitorPreregistratonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitorPreregistratonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VisitorPreregistratonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
